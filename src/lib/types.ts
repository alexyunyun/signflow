// ===== 全局类型定义 =====

export interface VocabItem {
  id: string
  word: string
  pinyin: string
  cat: string
  desc: string[]      // 打法步骤
  tip: string         // 记忆钩子
  imgs: string[]      // public/signs/ 下的图解文件名
}

export interface Sentence {
  id: string
  zh: string          // 汉语原句
  gloss: string[]     // 手语语序的词序列
  note: string        // 语法/表达提示
  scene: string       // 场景 id
}

export interface Settings {
  apiKey: string
  dailyNew: number    // 每日新词上限
  showPinyin: boolean
}

export interface SrsCard {
  word: string
  box: number         // SRS 阶段 0-7
  due: number         // 下次复习时间戳
  ts: number          // 首次学习时间
  seen: number        // 复习次数
  hit: number         // 答对次数
}

export interface DayStat { learn: number; review: number }

export interface Progress {
  days: Record<string, DayStat>
  lastDaily?: string  // 每日一签日期
}

export interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  text: string
  ts: number
  error?: string
}

export type QuizKind = 'word2sign' | 'img2word' | 'steps2word'

export interface ReviewGrade { forgot: boolean; fuzzy: boolean }
