import { useEffect, useRef, useState } from 'react'
import type { SrsCard, Settings, VocabItem } from './lib/types'
import { DEFAULT_SETTINGS, EMPTY_PROGRESS, bump, newCard, streakOf, todayKey, useLS } from './lib/store'
import { probe } from './lib/ai'
import { Home } from './views/Home'
import { Words } from './views/Words'
import { Learn } from './views/Learn'
import { Review } from './views/Review'
import { Sentences } from './views/Sentences'
import { Tutor } from './views/Tutor'
import { Resources } from './views/Resources'
import { SettingsPanel } from './components/SettingsPanel'
import { IHome, IBook, ICards, IRepeat, ISentence, ITutor, IRes, IGear } from './ui'

type TabId = 'home' | 'words' | 'learn' | 'review' | 'sentences' | 'tutor' | 'resources'

const TABS: { id: TabId; label: string; icon: typeof IHome }[] = [
  { id: 'home', label: '首页', icon: IHome },
  { id: 'learn', label: '学习', icon: ICards },
  { id: 'review', label: '复习', icon: IRepeat },
  { id: 'words', label: '词汇', icon: IBook },
  { id: 'sentences', label: '语句', icon: ISentence },
  { id: 'tutor', label: 'AI 助教', icon: ITutor },
  { id: 'resources', label: '资料', icon: IRes }
]

const TITLES: Record<TabId, string> = {
  home: '首页',
  words: '词汇图解词典',
  learn: '学习新词',
  review: '间隔复习',
  sentences: '日常语句',
  tutor: 'AI 手语助教',
  resources: '权威资料'
}

export function App() {
  const [settings, setSettings] = useLS<Settings>('sl.settings', DEFAULT_SETTINGS)
  const [cards, setCards] = useLS<Record<string, SrsCard>>('sl.cards', {})
  const [progress, setProgress] = useLS('sl.progress', EMPTY_PROGRESS)
  const [tab, setTab] = useState<TabId>('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [tutorSeed, setTutorSeed] = useState<{ q: string; ts: number } | undefined>()
  const [, setProbeTick] = useState(0)
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => { probe().finally(() => setProbeTick((t) => t + 1)) }, [])

  const streak = streakOf(progress)
  const todayLearned = progress.days[todayKey()]?.learn || 0

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2200)
  }

  /** 把词加入学习(SRS 从 0 档、立即到期,第一次复习就在今天) */
  function learnItem(item: VocabItem) {
    if (cards[item.word]) { showToast(`「${item.word}」已经在复习计划里啦`); return }
    setCards((cs) => ({ ...cs, [item.word]: newCard(item.word) }))
    setProgress((p) => bump(p, 'learn'))
    showToast(`🌱 已加入复习: ${item.word}`)
  }

  function gradeWord(word: string, g: 'forgot' | 'fuzzy' | 'good') {
    setCards((cs) => {
      const c = cs[word]
      if (!c) return cs
      const now = Date.now()
      let box = c.box
      let due: number
      if (g === 'forgot') { box = 0; due = now + 30 * 60000 }
      else if (g === 'fuzzy') { due = now + 12 * 3600000 }
      else { box = Math.min(c.box + 1, 7); due = now + [0, 1, 2, 4, 8, 15, 30, 60][box] * 86400000 }
      return { ...cs, [word]: { ...c, box, due, seen: c.seen + 1, hit: c.hit + (g === 'good' ? 1 : 0) } }
    })
    setProgress((p) => bump(p, 'review'))
  }

  const askAI = (word: string) => {
    setTutorSeed({ q: word, ts: Date.now() })
    setTab('tutor')
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">🤟</div>
          <div className="logo-text"><b>SignFlow</b><span>手语学习</span></div>
        </div>
        <nav className="nav">
          {TABS.map((t) => (
            <button key={t.id} className={t.id === tab ? 'nav-item on' : 'nav-item'} onClick={() => setTab(t.id)}>
              <t.icon />
              <span className="nv-label">{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          国家通用手语学习工具<br />内容参考《国家通用手语词典》<br />进度仅存于本机浏览器
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <h1>{TITLES[tab]}</h1>
          <div className="spacer" />
          <button className="icon-btn" title="设置" onClick={() => setSettingsOpen(true)}><IGear /></button>
        </div>
        <div className="content">
          {tab === 'home' && (
            <Home
              settings={settings}
              cards={cards}
              streak={streak}
              progressDays={Object.keys(progress.days).length}
              go={(t) => setTab(t as TabId)}
              onLearn={learnItem}
            />
          )}
          {tab === 'words' && <Words cards={cards} onLearn={learnItem} onAskAI={askAI} />}
          {tab === 'learn' && (
            <Learn
              settings={settings}
              cards={cards}
              todayLearned={todayLearned}
              onLearnItem={learnItem}
              goReview={() => setTab('review')}
            />
          )}
          {tab === 'review' && <Review cards={cards} onGrade={gradeWord} goLearn={() => setTab('learn')} />}
          {tab === 'sentences' && <Sentences cards={cards} onLearn={learnItem} onAskAI={askAI} />}
          {tab === 'tutor' && <Tutor settings={settings} seed={tutorSeed} openSettings={() => setSettingsOpen(true)} />}
          {tab === 'resources' && <Resources />}
        </div>
      </div>

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          cards={cards}
          onImport={(c) => setCards(c)}
          onClear={() => { setCards({}); setProgress(EMPTY_PROGRESS) }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
