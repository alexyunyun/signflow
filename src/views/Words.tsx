import { useMemo, useState } from 'react'
import type { SrsCard, VocabItem } from '../lib/types'
import { VOCAB, CATS, CAT_MAP } from '../content/cats'
import { WordDetail, imgSrc } from '../components/WordDetail'
import { ISearch } from '../ui'

export function Words(props: {
  cards: Record<string, SrsCard>
  onLearn: (item: VocabItem) => void
  onAskAI: (word: string) => void
}) {
  const { cards, onLearn, onAskAI } = props
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [onlyUnlearned, setOnlyUnlearned] = useState(false)
  const [detail, setDetail] = useState<VocabItem | null>(null)
  const [visible, setVisible] = useState(120)

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return VOCAB.filter((v) => {
      if (cat !== 'all' && v.cat !== cat) return false
      if (onlyUnlearned && cards[v.word]) return false
      if (!kw) return true
      return (
        v.word.includes(kw) ||
        v.pinyin.includes(kw) ||
        v.pinyin.replace(/\s/g, '').includes(kw.replace(/\s/g, '')) ||
        v.tip.includes(kw) ||
        v.desc.some((d) => d.includes(kw))
      )
    })
  }, [q, cat, onlyUnlearned, cards])

  // 筛选变化时重置分页
  const filterKey = `${q}|${cat}|${onlyUnlearned}`
  const [lastKey, setLastKey] = useState(filterKey)
  if (filterKey !== lastKey) { setLastKey(filterKey); setVisible(120) }

  return (
    <>
      <div className="search-box">
        <ISearch color="var(--ink-soft)" />
        <input
          placeholder="搜词语 / 拼音 / 打法描述…(如 nihao、谢谢、竖拇指)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="filter-row">
        <button className={cxChip(cat === 'all')} onClick={() => setCat('all')}>
          全部 {VOCAB.length}
        </button>
        {CATS.map((c) => {
          const n = VOCAB.filter((v) => v.cat === c.id).length
          if (!n) return null
          return (
            <button key={c.id} className={cxChip(cat === c.id)} onClick={() => setCat(c.id)}>
              {c.emoji} {c.label} {n}
            </button>
          )
        })}
        <button className={cxChip(onlyUnlearned)} onClick={() => setOnlyUnlearned((s) => !s)}>
          🕳 只看未学
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty-box sketch">
          <div className="big">🔍</div>
          没找到「{q}」相关的词<br />去问问 AI 助教,或到「视频教学」里搜一搜
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: '0 0 10px' }}>
            共 {list.length} 个词,显示前 {Math.min(visible, list.length)} 个
          </p>
          <div className="word-grid">
            {list.slice(0, visible).map((v) => (
              <div className="word-card sketch" key={v.id} onClick={() => setDetail(v)}>
                {cards[v.word] && <span className="learned-mark">✓学过</span>}
                {v.imgs.length ? (
                  <img src={imgSrc(v.imgs[0])} alt={`${v.word} 手语图解`} loading="lazy" />
                ) : (
                  <div className="noimg">🤟</div>
                )}
                <b>{v.word}</b>
                <div className="py">{CAT_MAP.get(v.cat)?.emoji} {v.pinyin}</div>
              </div>
            ))}
          </div>
          {visible < list.length && (
            <div style={{ textAlign: 'center', margin: '18px 0' }}>
              <button className="btn" onClick={() => setVisible((n) => n + 240)}>
                加载更多(还有 {list.length - visible} 个)
              </button>
            </div>
          )}
        </>
      )}

      {detail && (
        <WordDetail
          item={detail}
          learned={!!cards[detail.word]}
          onLearn={(it) => { onLearn(it); setDetail(null) }}
          onAskAI={onAskAI}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  )
}

function cxChip(on: boolean) {
  return on ? 'chip on' : 'chip'
}
