import { CAT_MAP, videoLink, dictLink } from '../content/cats'
import type { VocabItem } from '../lib/types'
import { IPlus, ICheck, IVideo, ITutor, IX } from '../ui'

export const imgSrc = (f: string) => `${import.meta.env.BASE_URL}signs/${f}`

export function Steps({ item }: { item: VocabItem }) {
  return (
    <div>
      {item.desc.map((s, i) => (
        <div className="step" key={i}>
          <span className="n">{i + 1}</span>
          <span>{s}</span>
        </div>
      ))}
    </div>
  )
}

export function WordDetail(props: {
  item: VocabItem
  learned: boolean
  onLearn?: (item: VocabItem) => void
  onAskAI?: (word: string) => void
  onClose: () => void
}) {
  const { item, learned, onLearn, onAskAI, onClose } = props
  const cat = CAT_MAP.get(item.cat)
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="mh-word">
            <h2>{item.word}</h2>
            <div className="py">{item.pinyin} · {cat ? `${cat.emoji} ${cat.label}` : item.cat}</div>
          </div>
          <div className="spacer" />
          <button className="icon-btn" onClick={onClose} aria-label="关闭"><IX /></button>
        </div>

        {item.imgs.length ? (
          <div className="detail-imgs">
            {item.imgs.map((f) => <img key={f} src={imgSrc(f)} alt={`${item.word} 手语图解`} loading="lazy" />)}
          </div>
        ) : (
          <div className="noimg-big">
            这个词暂无图解<br />建议点击下方「视频教学」对照学习
          </div>
        )}

        <Steps item={item} />
        {item.tip && <div className="tip-callout">💡 记忆钩子:{item.tip}</div>}

        <div className="action-row">
          {learned ? (
            <button className="btn small good" disabled><ICheck /> 已在复习计划</button>
          ) : (
            onLearn && (
              <button className="btn small primary" onClick={() => onLearn(item)}><IPlus /> 加入学习</button>
            )
          )}
          <a className="btn small" href={videoLink(item.word)} target="_blank" rel="noreferrer" title="官方词典 APP 的逐词视频无网页版;B 站上有各地残联官方号的教学视频,搜这个词跟着学">
            <IVideo /> 视频教学
          </a>
          <a className="btn small" href={dictLink(item.word)} target="_blank" rel="noreferrer">📖 图文词典</a>
          {onAskAI && <button className="btn small" onClick={() => onAskAI(item.word)}><ITutor /> 问 AI 助教</button>}
        </div>
        <div className="note" style={{ marginTop: 14 }}>
          打法描述整理自《国家通用手语常用词表》及公开手语资料,图解为示意画。同一个词各地打法可能略有差异,以官方词典视频为准。
        </div>
      </div>
    </div>
  )
}
