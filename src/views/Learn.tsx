import { useMemo, useState } from 'react'
import type { SrsCard, Settings, VocabItem } from '../lib/types'
import { VOCAB, CATS, CAT_MAP, videoLink } from '../content/cats'
import { Steps, imgSrc } from '../components/WordDetail'
import { IVideo, IRepeat } from '../ui'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Learn(props: {
  settings: Settings
  cards: Record<string, SrsCard>
  todayLearned: number
  onLearnItem: (item: VocabItem) => void
  goReview: () => void
}) {
  const { settings, cards, todayLearned, onLearnItem, goReview } = props
  const [cat, setCat] = useState('all')
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const pool = useMemo(() => {
    const un = VOCAB.filter((v) => !cards[v.word] && (cat === 'all' || v.cat === cat))
    return shuffle(un)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, Object.keys(cards).length])

  const remainQuota = Math.max(0, settings.dailyNew - todayLearned)
  const cur = pool[idx] as VocabItem | undefined
  const done = !cur || remainQuota <= 0

  const next = () => { setFlipped(false); setIdx((i) => i + 1) }

  if (done) {
    return (
      <div className="sess-done sketch">
        <div className="big">🎉</div>
        <h2>{remainQuota <= 0 ? '今日新词学满啦' : '这个分类都学完了'}</h2>
        <p>
          {remainQuota <= 0
            ? `已学 ${todayLearned} 个新词。趁热打铁,去复习一遍今天的内容吧!`
            : '换个分类继续,或者去复习学过的词。'}
        </p>
        <div className="flash-actions">
          <button className="btn primary" onClick={goReview}><IRepeat /> 去复习</button>
        </div>
      </div>
    )
  }

  const c = CAT_MAP.get(cur.cat)

  return (
    <div className="flash-stage">
      <div className="flash-meta">
        <span>
          本次:{cat === 'all' ? '混合新词' : `${c?.emoji} ${c?.label}`} · 还可学 {remainQuota} 个
        </span>
        <span>进度 {idx + 1} / {Math.min(pool.length, idx + remainQuota)}</span>
      </div>

      <div className={`flash-card sketch ${flipped ? 'back' : 'front'}`}>
        <span className="tag cat-chip">{c?.emoji} {c?.label}</span>
        {!flipped ? (
          <>
            <div className="big-word">{cur.word}</div>
            {settings.showPinyin && <div className="big-py">{cur.pinyin}</div>}
            <div className="flash-hint">🤔 先想一想:这个词怎么打?<br />想好了再翻面对照</div>
          </>
        ) : (
          <>
            <div className="big-word" style={{ marginTop: 40, fontSize: 32 }}>{cur.word}</div>
            {cur.imgs.length ? (
              <div className="imgs">
                {cur.imgs.map((f) => <img key={f} src={imgSrc(f)} alt={`${cur.word} 手语图解`} />)}
              </div>
            ) : (
              <div className="noimg-big" style={{ width: '100%', height: 72 }}>暂无图解,对照步骤和视频学习</div>
            )}
            <div className="steps"><Steps item={cur} /></div>
            {cur.tip && <div className="tip-callout" style={{ width: '100%' }}>💡 {cur.tip}</div>}
          </>
        )}
      </div>

      <div className="flash-actions">
        {!flipped ? (
          <>
            <button className="btn primary" onClick={() => setFlipped(true)}>翻面看打法</button>
            <button className="btn" onClick={next}>跳过</button>
          </>
        ) : (
          <>
            <button
              className="btn primary"
              onClick={() => { onLearnItem(cur); next() }}
            >
              记住了,下一个 ✓
            </button>
            <a className="btn" href={videoLink(cur.word)} target="_blank" rel="noreferrer"><IVideo /> 真人视频</a>
            <button className="btn" onClick={() => setFlipped(false)}>再看正面</button>
          </>
        )}
      </div>
    </div>
  )
}
