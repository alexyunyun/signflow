import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { SrsCard, Settings, Progress, DayStat } from './types'
import { SRS_INTERVALS } from '../content/cats'

// ===== localStorage 持久化 Hook =====
export function useLS<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw) as T
    } catch { /* 损坏数据当作不存在 */ }
    return initial
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* 存储满时静默 */ }
  }, [key, val])
  return [val, setVal]
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  dailyNew: 10,
  showPinyin: true
}

export const EMPTY_PROGRESS: Progress = { days: {} }

// ===== 日期工具 =====
export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function streakOf(progress: Progress): number {
  let n = 0
  const d = new Date()
  // 今天还没练不打断连击,从昨天往前数
  if (!progress.days[todayKey(d)]) d.setDate(d.getDate() - 1)
  while (progress.days[todayKey(d)]) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ===== SRS =====
export function newCard(word: string): SrsCard {
  return { word, box: 0, due: Date.now(), ts: Date.now(), seen: 0, hit: 0 }
}

/** due 距今的友好描述 */
export function dueLabel(due: number): string {
  const diff = due - Date.now()
  if (diff <= 0) return '现在'
  const h = diff / 3600000
  if (h < 1) return `${Math.max(1, Math.round(diff / 60000))} 分钟后`
  if (h < 24) return `${Math.round(h)} 小时后`
  return `${Math.round(h / 24)} 天后`
}

export function boxLabel(box: number): string {
  if (box >= 7) return '长期记忆 🌟'
  return `第 ${box + 1} 档 · ${SRS_INTERVALS[Math.min(box + 1, SRS_INTERVALS.length - 1)]} 天后复习`
}

// ===== 进度记录 =====
export function bump(p: Progress, key: keyof DayStat, n = 1): Progress {
  const k = todayKey()
  const day = p.days[k] || { learn: 0, review: 0 }
  day[key] += n
  return { ...p, days: { ...p.days, [k]: day } }
}

// ===== 复习调度 =====
export interface Queue {
  dueCards: SrsCard[]      // 真正到期
  earlyCards: SrsCard[]    // 未到期(可选提前复习)
}

export function buildQueue(cards: SrsCard[]): Queue {
  const now = Date.now()
  const dueCards = cards.filter((c) => c.due <= now)
  const earlyCards = cards.filter((c) => c.due > now)
  dueCards.sort((a, b) => a.due - b.due)
  earlyCards.sort((a, b) => a.due - b.due)
  return { dueCards, earlyCards }
}

export function masteredCount(cards: SrsCard[]): number {
  return cards.filter((c) => c.box >= 4).length
}
