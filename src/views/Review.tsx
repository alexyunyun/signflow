import { useMemo, useState } from 'react'
import type { QuizKind, SrsCard, VocabItem } from '../lib/types'
import { WORD_MAP, videoLink } from '../content/cats'
import { buildQueue, boxLabel } from '../lib/store'
import { Steps, imgSrc } from '../components/WordDetail'
import { IVideo, IRepeat, IDice } from '../ui'

type Grade = 'forgot' | 'fuzzy' | 'good'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickKind(item: VocabItem | undefined): QuizKind {
  const kinds: QuizKind[] = ['word2sign', 'steps2word']
  if (item && item.imgs.length) kinds.push('img2word', 'img2word') // 有图时"看图猜词"概率更高
  return kinds[Math.floor(Math.random() * kinds.length)]
}

export function Review(props: {
  cards: Record<string, SrsCard>
  onGrade: (word: string, g: Grade) => void
  goLearn: () => void
}) {
  const { cards, onGrade, goLearn } = props

  const [queue, setQueue] = useState<SrsCard[]>(() => buildQueue(Object.values(cards)).dueCards.slice(0, 30))
  const [early, setEarly] = useState(false)
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [answered, setAnswered] = useState<null | 'right' | 'wrong'>(null)
  const [answeredWord, setAnsweredWord] = useState('')
  const [kind, setKind] = useState<QuizKind>('word2sign')
  const [stats, setStats] = useState({ forgot: 0, fuzzy: 0, good: 0 })
  const [requeued, setRequeued] = useState<Set<string>>(new Set())

  const dueCount = useMemo(() => buildQueue(Object.values(cards)).dueCards.length, [cards])
  const card = queue[idx] as SrsCard | undefined
  const item = card ? WORD_MAP.get(card.word) : undefined

  // 选择题选项:优先同类词做干扰项
  const choices = useMemo(() => {
    if (!card || !item || (kind !== 'img2word' && kind !== 'steps2word')) return []
    const all = Array.from(WORD_MAP.values())
    const same = shuffle(all.filter((v) => v.cat === item.cat && v.word !== item.word)).slice(0, 3)
    const rest = shuffle(all.filter((v) => v.word !== item.word && !same.includes(v)))
    return shuffle([item, ...same, ...rest].slice(0, 4))
  }, [card, item, kind, idx])

  const startAt = (i: number, q: SrsCard[]) => {
    setIdx(i); setRevealed(false); setAnswered(null); setAnsweredWord('')
    setKind(pickKind(WORD_MAP.get(q[i]?.word)))
  }

  const finishGrade = (g: Grade) => {
    if (!card) return
    onGrade(card.word, g)
    setStats((s) => ({ ...s, [g]: s[g] + 1 }))
    // 忘了的卡重新排到队尾再过一遍(每张最多一次)
    let q = queue
    if (g === 'forgot' && !requeued.has(card.word)) {
      q = [...queue, card]
      setRequeued(new Set([...requeued, card.word]))
    }
    setQueue(q)
    const nextI = idx + 1
    if (nextI < q.length) startAt(nextI, q)
    else { setIdx(nextI); setRevealed(false); setAnswered(null) }
  }

  const answer = (c: VocabItem) => {
    if (!card || answered) return
    const right = c.word === card.word
    setAnswered(right ? 'right' : 'wrong')
    setAnsweredWord(right ? '' : c.word)
  }

  const restart = () => {
    setQueue(buildQueue(Object.values(cards)).dueCards.slice(0, 30))
    setEarly(false)
    setStats({ forgot: 0, fuzzy: 0, good: 0 })
    setRequeued(new Set())
    setIdx(0); setRevealed(false); setAnswered(null)
  }

  // ===== 空状态:无到期卡 =====
  if (queue.length === 0 || (idx >= queue.length && queue.length > 0)) {
    if (queue.length === 0 && idx === 0) {
      const earlyCards = buildQueue(Object.values(cards)).earlyCards.slice(0, 20)
      return (
        <div className="sess-done sketch">
          <div className="big">☕</div>
          <h2>现在没有到期的复习</h2>
          <p>
            {Object.keys(cards).length === 0
              ? '还没有学习记录,先去学几个词吧!'
              : '到点的卡片才会出现在这里,这样记忆效率最高。也可以提前过一遍。'}
          </p>
          <div className="flash-actions">
            {earlyCards.length > 0 && (
              <button className="btn primary" onClick={() => { setQueue(earlyCards); setEarly(true); startAt(0, earlyCards) }}>
                <IDice /> 提前复习 {earlyCards.length} 张
              </button>
            )}
            <button className="btn" onClick={goLearn}>去学新词</button>
          </div>
        </div>
      )
    }
    return (
      <div className="sess-done sketch">
        <div className="big">🙌</div>
        <h2>这轮复习完成!</h2>
        <p>
          记住 {stats.good} · 模糊 {stats.fuzzy} · 忘了 {stats.forgot}
          {stats.forgot === 0 && stats.good + stats.fuzzy > 0 && <><br />全对,太棒了!🌟</>}
          {stats.forgot > 0 && <><br />忘了的卡片 30 分钟后会再次到期。</>}
        </p>
        <div className="flash-actions">
          <button className="btn primary" onClick={restart}><IRepeat /> 再来一轮</button>
          <button className="btn" onClick={goLearn}>去学新词</button>
        </div>
      </div>
    )
  }

  const isChoice = kind === 'img2word' || kind === 'steps2word'
  if (!card) return null // 实际不可达:上面的空状态/完成态已覆盖

  return (
    <div className="flash-stage">
      <div className="flash-meta">
        <span>{early ? '提前复习' : '到期复习'} · {boxLabel(card.box)}</span>
        <span>{idx + 1} / {queue.length}{!early && dueCount > 30 ? `(本批 30 张,共到期 ${dueCount})` : ''}</span>
      </div>

      <div className={`flash-card sketch ${revealed || answered ? 'back' : 'front'}`}>
        {isChoice && !answered && item && (
          <>
            {kind === 'img2word' ? (
              <>
                <div className="imgs"><img src={imgSrc(item.imgs[0])} alt="看图猜词" /></div>
                <div className="flash-hint">👆 这是哪个词的手势?</div>
              </>
            ) : (
              <>
                <div className="steps" style={{ marginTop: 46 }}>
                  <div className="step"><span className="n">?</span><span>{item.desc[0]}</span></div>
                  {item.desc.length > 1 && <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>……(其余步骤稍后揭晓)</p>}
                </div>
                <div className="flash-hint">👆 按这个打法,它是哪个词?</div>
              </>
            )}
            <div className="choice-grid">
              {choices.map((c) => (
                <button
                  key={c.id}
                  className={`choice ${answered && c.word === card.word ? 'right' : ''} ${answered === 'wrong' && answeredWord === c.word ? 'wrong' : ''}`}
                  disabled={!!answered}
                  onClick={() => answer(c)}
                >
                  {c.word}
                </button>
              ))}
            </div>
          </>
        )}

        {(revealed || answered) && (
          <>
            <div className="big-word" style={{ marginTop: answered ? 24 : 36, fontSize: 28 }}>
              {card.word}
              {answered === 'right' && ' ✅'}
              {answered === 'wrong' && ' ❌ 正确答案'}
            </div>
            {answered && (
              <div className="result-banner">
                {answered === 'right' ? '答对了!再加深一遍印象 👇' : '没关系,看一遍正确打法 👇 30 分钟后再见到它'}
              </div>
            )}
            {item && item.imgs.length ? (
              <div className="imgs">{item.imgs.map((f) => <img key={f} src={imgSrc(f)} alt={`${item.word} 手语图解`} />)}</div>
            ) : (
              <div className="noimg-big" style={{ width: '100%', height: 60 }}>暂无图解,对照步骤与视频学习</div>
            )}
            {item && <div className="steps" style={{ textAlign: 'left' }}><Steps item={item} /></div>}
            {item?.tip && <div className="tip-callout" style={{ width: '100%' }}>💡 {item.tip}</div>}
            {item && (
              <a className="btn small" href={videoLink(item.word)} target="_blank" rel="noreferrer"><IVideo /> 真人视频对照</a>
            )}
          </>
        )}

        {!isChoice && !revealed && (
          <>
            <div className="big-word" style={{ marginTop: 56 }}>{card.word}</div>
            <div className="big-py">{item?.pinyin}</div>
            <div className="flash-hint">✋ 对着镜子把它打出来,再翻面对照</div>
          </>
        )}
      </div>

      <div className="flash-actions">
        {!isChoice && !revealed && (
          <button className="btn primary" onClick={() => setRevealed(true)}>翻面对照</button>
        )}
        {!isChoice && revealed && (
          <>
            <button className="btn warn grade-btn" onClick={() => finishGrade('forgot')}>😵 忘了</button>
            <button className="btn grade-btn" onClick={() => finishGrade('fuzzy')}>🤔 模糊</button>
            <button className="btn good grade-btn" onClick={() => finishGrade('good')}>😄 记住了</button>
          </>
        )}
        {answered && (
          <button className="btn primary" onClick={() => finishGrade(answered === 'right' ? 'good' : 'forgot')}>
            下一个 →
          </button>
        )}
      </div>
    </div>
  )
}
