// 词汇数据构建脚本:合并 vocab-meta.tsv(分类/钩子) + signs-raw.tsv(描述/图) + pinyin.json
// 运行:node scripts/build-vocab.mjs → 输出 src/content/vocab.json
// 改动词汇清单后需重新运行并提交产物
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')

// 人工校订:覆盖自动抓取的描述(抓取缺失或表述不清的词)
const OVERRIDES = {
  疼: '一手食指指点疼痛的部位,面露痛苦表情。',
  头: '一手五指微曲,罩于头顶,如轻摸头状。',
  嘴: '一手食指指向嘴部。',
  手: '一手五指自然张开,另一手食指指向其掌心。',
  贵: '一手拇、食指指尖相对,间距渐渐拉开,表示价钱往上抬。',
  地铁: '(一)一手食指向下指,表示地下;(二)双手握拳,虎口向上,一上一下,上拳敲打下拳,再向里移动,如列车沿轨道行驶。',
  会: '一手食指直立,指背向外,手腕向下弯动一下,表示能够。',
  写: '一手拇、食、中指如执笔,在另一手掌心或空中书写。',
  找: '一手食指直立,在眼前左右转动,如四处寻找。',
  问: '一手食指横于嘴前移动一下,再向前伸出,面露疑问神情。',
  晚安: '先打"晚上"手势(五指边合拢边下移,天色转暗),再双手合掌贴于脸侧,闭眼作睡觉状。',
  饱: '一手掌心贴于腹部轻拍两下,面露满足神情。',
  渴: '一手五指虚握如持杯,伸向嘴边作饮水状,面露干渴神情。',
  中国: '一手伸食指,自咽喉部顺肩胸划至腰间,沿旗袍前襟线示意。',
  唱歌: '双手伸拇、食指,食指尖对着喉部,同时向外移出两下,口张开,头随之轻晃。',
  生气: '一手食指竖立于鼻尖前,左右微微摆动,脸露怒容,表示气冲冲的样子。',
  妹妹: '(一)一手伸小指贴于嘴唇上,表示排行最小;(二)一手拇、食指捏耳垂,表示"女"。',
  同学: '(一)双手放于面前,如捧书状;(二)一手食指指向身旁同伴。(参考打法)',
  电影院: '(一)一手五指张开,掌心向内,在面前摆动几下,即"电影";(二)双手搭成"＾"形,如屋顶状,表示场所。',
  饭馆: '(一)一手拇、食指相对,中间留米粒大小距离,一手伸食、中指如持筷作吃饭状,即"饭";(二)双手搭成"＾"形,如屋顶状,表示场所。',
  公园: '(一)双手拇、食指搭成"公"字形;(二)双手拇、食指搭成圆形,表示园地。',
  打扫: '(一)一手握拳向下击打一下;(二)另一手五指并拢,掌心向外,左右扫动,如扫地状。',
  不好意思: '(一)一手直立,掌心向外,左右摆动几下,表示"不好";(二)一手打字母"Y"指式,食指在太阳穴处转一圈,表示"意思"。',
  大: '双手横伸,掌心向下,同时向两侧拉开,表示面积大。',
  小: '双手横伸,掌心向下,同时向中间靠拢,表示范围小。',
  药店: '连打字母"Y""O"指式,即"药";双手搭成"＾"形,如屋顶状,表示场所。',
  矮: '一手平伸,掌心向下,往下微压,表示高度低。',
  儿子: '(一)一手直立,五指并拢,掌心向内,置于头侧,自后向前挥动,即"男"手势;(二)一手平伸,掌心向下,于腰际微动,即"小孩"手势。',
  女儿: '(一)一手拇、食指捏耳垂,即"女"手势;(二)一手平伸,掌心向下,于腰际微动,即"小孩"手势。',
  下雪: '双手五指分开微曲,指尖向下,缓缓下降并向一旁飘移,象征雪花飘落之状。',
  服务员: '(一)右手伸平,手背向外,贴于耳前;(二)右手按在另一侧肩部,如招呼侍应。',
  拜托: '一手掌心向上,五指并拢,置于同侧肩膀上方,仿托物动作,表示托付、恳求。',
  手机: '一手五指微曲如持手机,置于眼前,另一手食指在"屏幕"上点划两下。(参考打法)'
}

// 打法描述拆成步骤
function steps(desc) {
  return desc
    .replace(/；/g, '。').replace(/。+/g, '。')
    .split('。').map((s) => s.trim()).filter(Boolean)
    .map((s) => (s.endsWith('。') ? s : s + '。'))
}

const pinyin = JSON.parse(read('data-src/pinyin.json'))
const raw = new Map()
for (const line of read('data-src/signs-raw.tsv').split('\n')) {
  const parts = line.split('\t')
  if (parts.length < 3) continue
  raw.set(parts[1], { id: parts[0], rest: parts[2] })
}

const usedOverrides = new Set()
const out = []
let noImg = 0
for (const line of read('data-src/vocab-meta.tsv').split('\n')) {
  const line2 = line.trim()
  if (!line2) continue
  const [word, cat, tip = ''] = line2.split('|')
  const py = pinyin[word]
  if (!py) { console.error('✗ 缺拼音:', word); continue }
  const r = raw.get(word)
  let desc = OVERRIDES[word] || (r ? r.rest.split('|')[0] : '')
  if (OVERRIDES[word]) usedOverrides.add(word)
  if (!desc) { console.error('✗ 无描述:', word); continue }
  // 清理残留
  desc = desc.replace(/\s+/g, ' ').replace(/\s。/g, '。').trim()
  const imgs = []
  if (r) {
    const list = r.rest.split('|').slice(1).filter(Boolean)
    list.forEach((_, i) => imgs.push(i === 0 ? `${py.id}.png` : `${py.id}-${i + 1}.png`))
  }
  if (!imgs.length) noImg++
  out.push({
    id: py.id,
    word,
    pinyin: py.pinyin,
    cat,
    desc: steps(desc),
    tip: tip.trim(),
    imgs
  })
}

const missed = Object.keys(OVERRIDES).filter((w) => !usedOverrides.has(w))
if (missed.length) console.error('⚠ 覆盖表里有清单外的词:', missed.join('、'))

out.sort((a, b) => (a.cat === b.cat ? a.id.localeCompare(b.id) : 0))
fs.writeFileSync(path.join(ROOT, 'src/content/vocab.json'), JSON.stringify(out, null, 1))
console.log(`✓ vocab.json:${out.length} 词,无图 ${noImg} 词`)
