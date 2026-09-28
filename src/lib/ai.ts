// ===== DeepSeek API 客户端 =====
// 传输层:优先走本地服务代理 /api/chat(推荐);若探测不到本地服务,
// 且用户在「设置」里填了 Key,则直接调用 api.deepseek.com。
// URL 参数加 ?demo=1 可进入演示模式(无需 Key,返回模拟数据,便于预览交互)。

const BASE_URL = 'https://api.deepseek.com'
export const MODEL = 'deepseek-chat'

export type ChatMsgInput = { role: 'system' | 'user' | 'assistant'; content: string }

let mode: 'proxy' | 'direct' | 'unknown' = 'unknown'
let proxyHasKey = false

export const isDemo = () => new URLSearchParams(location.search).has('demo')

export async function probe(): Promise<void> {
  if (isDemo()) { mode = 'proxy'; proxyHasKey = true; return }
  try {
    const r = await fetch('/api/health', { signal: AbortSignal.timeout(2500) })
    if (r.ok) {
      const j = await r.json()
      mode = 'proxy'
      proxyHasKey = Boolean(j.hasKey)
      return
    }
  } catch { /* 无本地服务 */ }
  mode = 'direct'
}

/** 当前配置下 AI 是否可用(userKey = 用户在设置里填的 Key) */
export function aiReady(userKey: string): boolean {
  if (isDemo()) return true
  if (userKey.trim()) return true
  return mode === 'proxy' && proxyHasKey
}

export function aiModeHint(userKey = ''): string {
  if (isDemo()) return '演示模式:返回模拟数据,不消耗额度'
  if (userKey.trim()) return mode === 'proxy' ? '已填 Key:将经由本地服务调用' : '已填 Key:浏览器直连 DeepSeek'
  if (mode === 'proxy') return proxyHasKey ? 'AI 已就绪(服务端 Key)' : 'AI 就绪需在设置里填入 Key'
  return '未检测到本地服务,需在设置里填 Key 直连 DeepSeek'
}

function friendlyError(status: number, raw: string): string {
  let detail = raw
  try {
    const j = JSON.parse(raw)
    detail = j?.message || j?.error?.message || raw
  } catch { /* keep raw */ }
  if (status === 401) return `API Key 无效或未配置:${detail}`
  if (status === 402) return `账户余额不足:${detail}`
  if (status === 429) return `请求过于频繁,稍后再试:${detail}`
  return `请求失败(${status}):${detail}`
}

/** 流式对话。返回完整回复文本。 */
export async function chatStream(
  messages: ChatMsgInput[],
  opts: {
    userKey?: string
    temperature?: number
    maxTokens?: number
    signal?: AbortSignal
    onDelta?: (delta: string) => void
  } = {}
): Promise<string> {
  const { userKey = '', temperature = 0.8, maxTokens = 900, signal, onDelta } = opts

  if (isDemo()) return demoStream(messages, onDelta)

  const url = mode === 'proxy' ? '/api/chat' : `${BASE_URL}/chat/completions`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (userKey.trim()) headers['x-api-key'] = userKey.trim()

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      temperature,
      max_tokens: maxTokens
    })
  })

  if (!resp.ok) throw new Error(friendlyError(resp.status, await resp.text().catch(() => '')))

  const reader = resp.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) {
      const l = line.trim()
      if (!l.startsWith('data:')) continue
      const payload = l.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const j = JSON.parse(payload)
        const delta: string = j.choices?.[0]?.delta?.content || ''
        if (delta) { full += delta; onDelta?.(delta) }
      } catch { /* 跳过不完整行 */ }
    }
  }
  if (!full.trim()) throw new Error('AI 返回了空内容,请重试')
  return full
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ===== 演示模式(模拟数据,便于无 Key 预览) =====
const DEMO_REPLIES = [
  '「谢谢」的打法:一手伸拇指,对着对方向前弯动两下,记得面带微笑~\n\n想练真实对话,请在「设置」里填入 DeepSeek API Key 哦。',
  '手语的语序和汉语不太一样:时间词通常放最前面,比如"明天我去上海"要打成「明天 我 上海 去」。\n\n(演示模式回复,填 Key 后可以问更多)',
  '「对不起」:一手五指并拢举于额际,先做敬礼式,然后下放改伸小指,在胸口点几下,表示自责。\n\n(演示模式,配置 Key 后可畅聊)',
  '学手语小贴士:表情就是语气!问句挑眉、否定摇头、赞美竖拇指时眼睛要亮。脸上没戏,手上白搭~\n\n(演示模式回复)',
  '《国家通用手语词典》APP 有 8214 个词的真人视频,遇到拿不准的词去查最权威。也可以点词汇卡上的"看真人演示"直达视频。\n\n(演示模式回复)'
]

async function demoStream(messages: ChatMsgInput[], onDelta?: (d: string) => void): Promise<string> {
  const count = messages.filter((m) => m.role === 'user').length
  const text = DEMO_REPLIES[(count - 1 + DEMO_REPLIES.length) % DEMO_REPLIES.length]
  const parts = text.split('')
  for (const w of parts) {
    onDelta?.(w)
    if (w === '\n') await sleep(120)
  }
  return text
}
