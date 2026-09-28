import { useMemo } from 'react'
import type { SrsCard, Settings, VocabItem } from '../lib/types'
import { VOCAB, CATS, CAT_MAP } from '../content/cats'
import { RESOURCES } from '../content/resources'
import { streakOf, buildQueue, masteredCount } from '../lib/store'
import { IFlame, IStar, IRepeat, IBook, IPlus, Squiggle } from '../ui'
import { WordDetail, imgSrc } from '../components/WordDetail'
import { useState } from 'react'

export function Home(props: {
  settings: Settings
  cards: Record<string, SrsCard>
  progressDays: number
  streak: number
  go: (tab: string) => void
  onLearn: (item: VocabItem) => void
}) {
  const { settings, cards, streak, go, onLearn } = props
  const [detail, setDetail] = useState<VocabItem | null>(null)
  const cardList = useMemo(() => Object.values(cards), [cards])
  const queue = useMemo(() => buildQueue(cardList), [cardList])

  // 每日一签:按日期确定性挑词
  const daily = useMemo(() => {
    const d = new Date()
    const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()
    return VOCAB[seed % VOCAB.length]
  }, [])

  return (
    <>
      <div className="hero">
        <div className="hero-say sketch">
          <h2>今天,也用手说说话吧 🤟</h2>
          <p>
            基于中国残联《国家通用手语词典》体系整理的全量词库:
            {VOCAB.length} 个词、{CATS.length} 个分类,配图解、语句、间隔复习和 AI 助教。
          </p>
        </div>
        <div className="hero-hand" aria-hidden>👋</div>
      </div>

      <div className="stat-row">
        <div className="stat sketch alt"><IFlame color="var(--peach)" /><div><div className="num">{streak}</div><div className="lbl">连续天数</div></div></div>
        <div className="stat sketch alt"><IBook color="var(--sky)" /><div><div className="num">{cardList.length}</div><div className="lbl">已学词汇</div></div></div>
        <div className="stat sketch alt"><IStar color="var(--butter)" /><div><div className="num">{masteredCount(cardList)}</div><div className="lbl">掌握(4 档+)</div></div></div>
        <div className="stat sketch alt"><IRepeat color="var(--sage)" /><div><div className="num">{queue.dueCards.length}</div><div className="lbl">今日待复习</div></div></div>
      </div>

      <div className="duo">
        <div className="panel sketch">
          <h3>🌱 每日一签<Squiggle width={70} /></h3>
          <div className="daily-word">
            {daily.imgs.length ? (
              <img src={imgSrc(daily.imgs[0])} alt={`${daily.word} 手语图解`} />
            ) : (
              <div className="noimg-big" style={{ width: 108, height: 90, margin: 0 }}>暂无图解</div>
            )}
            <div className="dw-main">
              <b>{daily.word}</b>
              <div className="py">{daily.pinyin} · {CAT_MAP.get(daily.cat)?.label}</div>
              <p>{daily.desc[0]}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn small" onClick={() => setDetail(daily)}>看详情</button>
                {!cards[daily.word] && (
                  <button className="btn small primary" onClick={() => onLearn(daily)}><IPlus /> 学它</button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="panel sketch alt">
          <h3>⚡ 现在就练</h3>
          <div className="quick">
            <button className="btn" onClick={() => go('learn')}>学习新词 →</button>
            <button className="btn primary" onClick={() => go('review')}>
              复习 {queue.dueCards.length ? `(${queue.dueCards.length} 张到期)` : '(提前过一遍)'}
            </button>
            <button className="btn" onClick={() => go('sentences')}>练日常语句 →</button>
          </div>
        </div>
      </div>

      <div className="panel sketch">
        <h3>📚 权威资料精选</h3>
        {RESOURCES.slice(0, 3).map((r) => (
          <div className="res-item" key={r.name}>
            <span className={`res-tag tag t-${r.tag}`}>{r.tag}</span>
            <a href={r.url} target="_blank" rel="noreferrer">{r.name}</a>
            <div className="by">{r.by}</div>
            <p>{r.desc}</p>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <button className="btn small" onClick={() => go('resources')}>查看全部资料 →</button>
        </div>
      </div>

      <div className="note">
        🖐 关于内容:词库收录自公开手语词典图文资料(便民查询网,基于《中国手语》体系),部分词条配打法示意图,图片在陆续补充中。
        手语有地域差异,标准打法请以《国家通用手语词典》APP 的真人视频为准——点任何词汇卡里的「视频教学」即可搜索学习。
        学习进度仅保存在你的浏览器里。
      </div>

      {detail && (
        <WordDetail
          item={detail}
          learned={!!cards[detail.word]}
          onLearn={(it) => { onLearn(it); setDetail(null) }}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  )
}
