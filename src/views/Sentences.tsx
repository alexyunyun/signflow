import { useState } from 'react'
import { SENTENCES, SCENES } from '../content/sentences'
import { WORD_MAP, videoLink } from '../content/cats'
import type { SrsCard, VocabItem } from '../lib/types'
import { WordDetail, imgSrc } from '../components/WordDetail'

export function Sentences(props: {
  cards: Record<string, SrsCard>
  onLearn: (item: VocabItem) => void
  onAskAI: (word: string) => void
}) {
  const { cards, onLearn, onAskAI } = props
  const [scene, setScene] = useState('meet')
  const [detail, setDetail] = useState<VocabItem | null>(null)
  const list = SENTENCES.filter((s) => s.scene === scene)

  return (
    <>
      <div className="scene-row">
        {SCENES.map((s) => (
          <button key={s.id} className={scene === s.id ? 'chip on' : 'chip'} onClick={() => setScene(s.id)}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {list.map((s) => (
        <div className="sent-card sketch" key={s.id}>
          <div className="sent-zh">「{s.zh}」</div>
          <div className="gloss-flow">
            {s.gloss.map((g, i) => {
              const v = WORD_MAP.get(g)
              return (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {i > 0 && <span className="gloss-arrow">›</span>}
                  <span
                    className={`gloss-token ${v ? '' : 'unknown'}`}
                    style={v ? { cursor: 'pointer' } : undefined}
                    onClick={() => v && setDetail(v)}
                    title={v ? '点击看完整词条' : '该词暂未收录,可问 AI 助教'}
                  >
                    {v && v.imgs.length ? <img src={imgSrc(v.imgs[0])} alt={`${g} 手势图解`} loading="lazy" /> : null}
                    <span className={v && v.imgs.length ? 'gt-wi' : 'gt-wo'}>{g}</span>
                  </span>
                </span>
              )
            })}
          </div>
          <div className="sent-note">💬 {s.note}</div>
        </div>
      ))}

      <div className="note">
        🖐 手语不是汉语的手指翻译:虚词(的/了/吗)大多省略,靠<strong>表情</strong>和<strong>语序</strong>表达语气。
        句子里的手势图块可以点击查看完整词条;想系统学语序,推荐资料页的 MOOC《手语基础——跟着聋人学手语》。
      </div>

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
