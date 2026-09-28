import { RESOURCES } from '../content/resources'

export function Resources() {
  return (
    <>
      <div className="hero" style={{ marginBottom: 14 }}>
        <div className="hero-say sketch" style={{ transform: 'none' }}>
          <h2>📖 权威资料导航</h2>
          <p>学手语,认准官方源头。下面这些是中国残联、教育部体系与高校的资源,本站词汇也以它们为准。</p>
        </div>
      </div>

      <div className="panel sketch">
        {RESOURCES.map((r) => (
          <div className="res-item" key={r.name}>
            <span className={`res-tag tag t-${r.tag}`}>{r.tag}</span>
            <a href={r.url} target="_blank" rel="noreferrer">{r.name}</a>
            <div className="by">{r.by}</div>
            <p>{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="note">
        🖐 为什么推荐官方 APP:手语是有版权的真人影像资料,网络上的零散图文可能混合了地方手语或过时打法。
        《国家通用手语词典》APP 由聋人模特演示,是国家推广的权威版本;免费部分已够入门,纸质书读者可解锁全部内容。
      </div>
    </>
  )
}
