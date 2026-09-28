import { useEffect, useRef, useState } from 'react'
import type { ChatMsg, Settings } from '../lib/types'
import { aiReady, chatStream } from '../lib/ai'
import { uid } from '../lib/store'
import { IGear } from '../ui'

const SYSTEM_PROMPT = `你是「国家通用手语」学习助教,依据中国残联组编《国家通用手语词典》(2019)与《国家通用手语常用词表》(GF 0020—2018)回答问题。你的职责:
1. 解释词语或句子的打法:按「手形→位置→动作→朝向→表情」五要素分步骤描述,复杂词分(一)(二)步,让初学者能照着模仿;
2. 把汉语句子改写成手语语序(逐词列出),说明省略了哪些虚词、表情和身体语言如何配合;
3. 讲解手语语法特点(时间词放句首、主题先行、疑问靠表情、否定词位置灵活等)和聋人文化礼仪(视线接触、不要边嚼东西边打、拍肩唤起注意等);
4. 给学习者出小测验或布置练习。

要求:用中文回答,亲切自然,多用换行和短句;打法描述要具体、可模仿;手语存在地域差异且词典会更新,对没把握的打法要提醒"建议在《国家通用手语词典》APP 里核对真人视频",不要编造权威性。`

const QUICK_CHIPS = [
  '「加油」用手语怎么打?',
  '把「明天下午我想去图书馆」转成手语语序',
  '手语有哪些和汉语不一样的语法?',
  '第一次和聋人朋友交流,要注意什么礼仪?',
  '给我出 5 道手语小测验题'
]

export function Tutor(props: {
  settings: Settings
  seed?: { q: string; ts: number }
  openSettings: () => void
}) {
  const { settings, seed, openSettings } = props
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || busy) return
    if (!aiReady(settings.apiKey)) { openSettings(); return }

    const userMsg: ChatMsg = { id: uid(), role: 'user', text, ts: Date.now() }
    const aiMsg: ChatMsg = { id: uid(), role: 'assistant', text: '', ts: Date.now() }
    setMsgs((m) => [...m, userMsg, aiMsg])
    setInput('')
    setBusy(true)

    // 只保留最近 12 条,控制 token 用量
    const history = msgs.slice(-12).map((m) => ({ role: m.role, content: m.text }))
    try {
      await chatStream(
        [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: text }],
        {
          userKey: settings.apiKey,
          onDelta: (d) => {
            setMsgs((m) => m.map((x) => (x.id === aiMsg.id ? { ...x, text: x.text + d } : x)))
          }
        }
      )
    } catch (e) {
      setMsgs((m) => m.map((x) => (x.id === aiMsg.id ? { ...x, error: (e as Error).message } : x)))
    } finally {
      setBusy(false)
    }
  }

  // 从词条详情「问 AI 助教」跳转过来
  useEffect(() => {
    if (seed) send(`「${seed.q}」用手语怎么打?请分步骤讲清楚。`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.ts])

  return (
    <div className="tutor-wrap">
      <div className="tutor-log" ref={logRef}>
        {msgs.length === 0 && (
          <div className="empty-box" style={{ padding: '26px 10px' }}>
            <div className="big">🤟</div>
            我是你的手语助教<br />
            问打法、改语序、讲语法、出测验都可以
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`bubble ${m.role} sketch ${m.error ? 'error' : ''}`}>
            {m.text || (m.error ? `❌ ${m.error}` : '…')}
          </div>
        ))}
        {busy && !msgs[msgs.length - 1]?.text && (
          <div className="bubble assistant sketch">正在想…</div>
        )}
      </div>

      <div className="tutor-chips">
        {QUICK_CHIPS.map((c) => (
          <button key={c} className="chip" onClick={() => send(c)} disabled={busy}>{c}</button>
        ))}
      </div>

      <div className="tutor-input">
        <textarea
          placeholder="比如:『没关系』怎么打?/ 这句话用手语怎么说:……"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
          }}
        />
        <button className="btn primary" onClick={() => send(input)} disabled={busy || !input.trim()}>
          发送
        </button>
        {!aiReady(settings.apiKey) && (
          <button className="icon-btn" title="配置 API Key" onClick={openSettings}><IGear /></button>
        )}
      </div>
    </div>
  )
}
