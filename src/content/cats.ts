// ===== 内容元数据 =====
import type { VocabItem } from '../lib/types'
import data from './vocab.json'

export const VOCAB = data as unknown as VocabItem[]
export const WORD_MAP = new Map(VOCAB.map((v) => [v.word, v]))
export const ID_MAP = new Map(VOCAB.map((v) => [v.id, v]))

// SRS 间隔(天),box 0→7
export const SRS_INTERVALS = [0, 1, 2, 4, 8, 15, 30, 60]

export interface CatMeta { id: string; label: string; emoji: string; blurb: string }

export const CATS: CatMeta[] = [
  { id: 'greet', label: '问候礼仪', emoji: '👋', blurb: '打招呼、感谢、道歉,迈出第一步' },
  { id: 'people', label: '人称称谓', emoji: '🧑‍🤝‍🧑', blurb: '你我他、家人朋友、职业称呼' },
  { id: 'time', label: '数字时间', emoji: '⏰', blurb: '从 1 数到 10,聊聊今天明天' },
  { id: 'place', label: '场所地点', emoji: '🏠', blurb: '家、学校、医院、超市怎么走' },
  { id: 'food', label: '饮食美味', emoji: '🍚', blurb: '一日三餐、酸甜辣咸' },
  { id: 'action', label: '动作行为', emoji: '🏃', blurb: '吃喝看听说,日常高频动词' },
  { id: 'learn', label: '学习工作', emoji: '📚', blurb: '上班开会、努力进步' },
  { id: 'mood', label: '情绪感受', emoji: '😊', blurb: '喜怒哀乐,表情是手语的一半' },
  { id: 'health', label: '身体健康', emoji: '🏥', blurb: '哪里不舒服,看病买药' },
  { id: 'describe', label: '描述疑问', emoji: '❓', blurb: '大小多少、什么哪里' },
  { id: 'things', label: '生活物件', emoji: '🎒', blurb: '钱物、衣物、居家用品' },
  { id: 'travel', label: '交通出行', emoji: '🚌', blurb: '火车飞机、马路公交' },
  { id: 'weather', label: '天气节令', emoji: '🌤', blurb: '晴雨冷暖、四季节日' }
]

export const CAT_MAP = new Map(CATS.map((c) => [c.id, c]))

/** 每个词的"真人演示"视频检索链接 */
export function videoLink(word: string): string {
  return `https://search.bilibili.com/all?keyword=${encodeURIComponent('手语 ' + word + ' 教程')}`
}

/** 便民查询网手语词典图文页(图解图片来源) */
export function dictLink(word: string): string {
  return `https://shouyu.bmcx.com/${encodeURIComponent(word)}__shouyus/`
}
