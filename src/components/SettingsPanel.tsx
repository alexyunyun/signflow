import { useRef } from 'react'
import type { Settings, SrsCard } from '../lib/types'
import { aiModeHint } from '../lib/ai'
import { IX, IDownload, IUpload } from '../ui'

export function SettingsPanel(props: {
  settings: Settings
  onChange: (s: Settings) => void
  cards: Record<string, SrsCard>
  onImport: (cards: Record<string, SrsCard>) => void
  onClear: () => void
  onClose: () => void
}) {
  const { settings, onChange, cards, onImport, onClear, onClose } = props
  const fileRef = useRef<HTMLInputElement>(null)

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: 1, cards }, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `signflow-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importData = (f: File) => {
    f.text().then((t) => {
      try {
        const j = JSON.parse(t)
        if (j?.cards && typeof j.cards === 'object') {
          onImport(j.cards)
          alert(`已导入 ${Object.keys(j.cards).length} 个词的学习进度`)
        } else alert('文件格式不对:需要 SignFlow 导出的进度 JSON')
      } catch { alert('文件解析失败') }
    })
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>设置</h2>
          <div className="spacer" />
          <button className="icon-btn" onClick={onClose} aria-label="关闭"><IX /></button>
        </div>

        <div className="set-group">
          <h3>🤖 DeepSeek API Key</h3>
          <p className="desc">
            AI 助教需要 DeepSeek 的 Key,在 <a href="https://platform.deepseek.com/" target="_blank" rel="noreferrer">platform.deepseek.com</a> 创建后粘贴到这里。
            Key 只保存在你自己的浏览器 localStorage,请求直接从你的设备发往 DeepSeek(或经本地服务转发,见 README)。
            {aiModeHint(settings.apiKey) && <><br />当前状态:{aiModeHint(settings.apiKey)}</>}
          </p>
          <input
            className="text-input"
            type="password"
            placeholder="sk-..."
            value={settings.apiKey}
            onChange={(e) => onChange({ ...settings, apiKey: e.target.value.trim() })}
          />
        </div>

        <div className="set-group">
          <h3>📚 每日新词上限</h3>
          <div className="range-row">
            <input
              type="range" min={3} max={30} step={1}
              value={settings.dailyNew}
              onChange={(e) => onChange({ ...settings, dailyNew: Number(e.target.value) })}
            />
            <b style={{ minWidth: 46, textAlign: 'right' }}>{settings.dailyNew} 词</b>
          </div>
          <p className="desc">学习模式下每次推进的新词数量。</p>
        </div>

        <div className="set-group">
          <h3>🔤 显示拼音</h3>
          <div className="switch-row">
            <span>词汇卡和闪卡上显示拼音</span>
            <input
              type="checkbox" checked={settings.showPinyin}
              onChange={(e) => onChange({ ...settings, showPinyin: e.target.checked })}
            />
          </div>
        </div>

        <div className="set-group">
          <h3>💾 学习进度</h3>
          <p className="desc">已学 {Object.keys(cards).length} 个词。进度保存在浏览器 localStorage,换设备或清理浏览器前记得导出。</p>
          <div className="data-row">
            <button className="btn small" onClick={exportData}><IDownload /> 导出进度</button>
            <button className="btn small" onClick={() => fileRef.current?.click()}><IUpload /> 导入进度</button>
            <input
              ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = '' }}
            />
          </div>
        </div>

        <div className="set-group danger-zone">
          <h3>⚠️ 清空数据</h3>
          <p className="desc">删除本机保存的全部学习记录,不可恢复。</p>
          <button
            className="btn small warn"
            onClick={() => { if (confirm('确定清空所有学习进度?')) { onClear(); onClose() } }}
          >
            清空学习进度
          </button>
        </div>
      </div>
    </div>
  )
}
