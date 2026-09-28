// 词汇数据构建脚本 v2:全量词库
// 数据源:
//   data-src/bmcx-full.tsv      全量爬取(id 词 bmcx分类 描述|图片URL)
//   data-src/vocab-meta.tsv     精选词条覆盖(词|分类|记忆钩子)
//   data-src/signs-raw.tsv      精选词条的描述与多图(pinyin-id 词 描述|图片URL)
//   data-src/pinyin-full.json   全量拼音映射(python scripts/gen-pinyin.py 生成)
// 运行:node scripts/build-vocab.mjs → src/content/vocab.json
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8')
const exists = (p) => fs.existsSync(path.join(ROOT, p))

// bmcx 分类 → 应用分类
const CAT_OF_BMCX = {
  卫生: 'health', 心理: 'mood', 时间: 'time', 数目: 'time', 数量词: 'time',
  交通邮电: 'travel', 日用品: 'things', 服饰: 'things', 天体气象: 'weather',
  教育: 'learn', 工作: 'learn', 地理地质: 'place', 洲洋国家名称: 'place',
  党政机关: 'place', 动物: 'nature', 植物: 'nature', 体育: 'general',
  饮食: 'food', 服装: 'things'
}

// 关键词规则(优先于 bmcx 分类)
const RULES = [
  ['people', /爸爸妈妈爷爷奶奶外公外婆叔伯姑舅姨哥姐弟妹夫妻丈夫妻子儿女孙子女婴儿宝宝聋人听人朋友老师同学医生护士司机警察厨师演员歌手翻译邻居亲戚]/],
  ['people', /^(我|你|他|她|它|我们|你们|他们|她们|它们|大家|自己|别人|谁)/],
  ['greet', /^(你好|您好|再见|谢谢|请|对不起|没关系|欢迎|晚安|早上好|中午好|下午好|晚上好|拜托|不好意思|加油|请进|请坐|辛苦|抱歉|原谅)/],
  ['food', /(饭|菜|面|米|肉|蛋|奶|茶|咖啡|酒|糖|盐|果|瓜|桃|橘|橙|蕉|葡萄|饼|包|饺|糕|汤|粥|饱|饿|渴|吃|喝|尝|辣|酸|甜|咸|苦|鲜)/],
  ['health', /(病|疼|痛|药|医|院|感冒|发烧|咳嗽|伤|护士|挂号|针|脉|血压|血|住院|体检|残|哑|盲|保健)/],
  ['action', /(走|跑|跳|坐|站|来|去|回|拿|给|找|等|买|卖|开|关|洗|擦|扫|扔|捡|推|拉|抱|背|提|举|敲|按|写|画|说|讲|问|答|听|看|闻|尝|想|记|忘|睡|起|躺|爬|游|飞|唱|舞|玩|打|踢|教|学|读|借|还|送|接|递|寄|搬|修|做|用|要|给|帮|鼓掌)/],
  ['mood', /(高兴|快乐|开心|生气|怒|难过|悲伤|哭|愁|急|怕|紧张|满意|喜欢|爱|恨|笑|害羞|尴尬|无聊|感动|可怜|委屈|羡慕|骄傲|后悔|失望|放心)/],
  ['weather', /(天气|晴|阴|雨|雪|风|雷|电|雾|霜|冰|雹|台风|云|太阳|月亮|星星|热|冷|暖|凉|干|湿|春夏秋冬)/],
  ['describe', /(大|小|多|少|高|矮|长|短|宽|窄|厚|薄|深|浅|快|慢|新|旧|好|坏|美|丑|胖|瘦|贵|便宜|干净|脏|什么|谁|哪|为什么|怎么|几|颜色|红|黄|蓝|绿|白|黑|紫|粉|灰|棕)/],
  ['travel', /(车|船|飞机|火车|地铁|公交|路|街|桥|站|票|机场|港口|红绿灯|方向|前后左右)/],
  ['time', /(今天|明天|昨天|上午|下午|晚上|早上|中午|年|月|日|天|小时|分钟|秒|星期|周|季节|春|夏|秋|冬|现在|过去|以前|以后|刚才|马上|经常|有时候|节日|春节|生日)/],
  ['things', /(书|笔|纸|包|门|窗|桌|椅|床|灯|伞|碗|杯|勺|筷子|刀|剪|锁|钥匙|表|镜|衣|裤|鞋|帽|袜|被|枕头|手机|电话|电脑|电视|相机|钱|信|礼物)/],
  ['place', /(学校|教室|图书馆|食堂|办公室|医院|银行|邮局|超市|商店|公园|电影院|公司|工厂|家|家乡|城市|农村|北京|上海|国|省|市|县|馆|所|局|厅|部)/],
  ['learn', /(课|校|班|级|师|生|考试|作业|毕业|大学|中学|小学|幼儿园|语文|数学|英语|字|词|句|拼音|语法|学习|复习|练习|文化|知识)/]
]

function classify(word, bmcxCat) {
  for (const [cat, re] of RULES) if (re.test(word)) return cat
  return CAT_OF_BMCX[bmcxCat] || 'general'
}

function steps(desc) {
  return desc
    .replace(/；/g, '。').replace(/。+/g, '。')
    .split('。').map((s) => s.trim()).filter(Boolean)
    .map((s) => (s.endsWith('。') ? s : s + '。'))
}

const IMG_DIR = path.join(ROOT, 'public/signs')
const imgExists = (f) => exists(`public/signs/${f}`)

// ---- 精选词条(第一批,带人工钩子与多图) ----
const pinyinOld = JSON.parse(read('data-src/pinyin.json'))
const curated = new Map()
for (const line of read('data-src/vocab-meta.tsv').split('\n')) {
  const line2 = line.trim()
  if (!line2) continue
  const [word, cat, tip = ''] = line2.split('|')
  const py = pinyinOld[word]
  curated.set(word, { cat, tip: tip.trim(), pyid: py?.id, pinyin: py?.pinyin })
}
const raw1 = new Map()
for (const line of read('data-src/signs-raw.tsv').split('\n')) {
  const parts = line.split('\t')
  if (parts.length < 3) continue
  raw1.set(parts[1], parts[2])
}

// ---- 全量爬取数据 ----
const pinyinFull = JSON.parse(read('data-src/pinyin-full.json'))
const crawled = new Map() // word → {wid, bmcxCat, desc, img}
for (const line of read('data-src/bmcx-full.tsv').split('\n')) {
  const parts = line.split('\t')
  if (parts.length < 4) continue
  const [wid, word, bmcxCat, rest] = parts
  if (crawled.has(word)) continue // 多分类重复词条,保留第一个
  const [desc, img] = rest.split('|')
  crawled.set(word, { wid, bmcxCat, desc, img })
}

// ---- 合并 ----
const OVERRIDES = JSON.parse(read('data-src/desc-overrides.json'))
const usedOv = new Set()
const out = []
let noImg = 0, noDesc = 0

function push(entry) {
  if (!entry.imgs.length) noImg++
  if (!entry.desc.length) noDesc++
  if (!entry.desc.length && !entry.imgs.length) return
  out.push(entry)
}

for (const [word, c] of curated) {
  const py = pinyinFull[word] || { pinyin: c.pinyin || word, id: c.pyid || word }
  const r = raw1.get(word)
  let desc = OVERRIDES[word] ?? (r ? r.split('|')[0] : '')
  if (OVERRIDES[word]) usedOv.add(word)
  const imgs = []
  if (r) r.split('|').slice(1).filter(Boolean).forEach((_, i) => imgs.push(i === 0 ? `${py.id}.png` : `${py.id}-${i + 1}.png`))
  imgs.filter(imgExists)
  push({
    id: py.id, word, pinyin: py.pinyin, cat: c.cat,
    desc: steps(desc.replace(/\s+/g, ' ').trim()),
    tip: c.tip, imgs
  })
}

for (const [word, e] of crawled) {
  if (curated.has(word)) continue
  const py = pinyinFull[word]
  if (!py) continue
  let desc = OVERRIDES[word] ?? e.desc
  if (OVERRIDES[word]) usedOv.add(word)
  const imgs = []
  if (e.img && imgExists(`w${e.wid}.png`)) imgs.push(`w${e.wid}.png`)
  push({
    id: py.id, word, pinyin: py.pinyin,
    cat: classify(word, e.bmcxCat),
    desc: steps(desc.replace(/\s+/g, ' ').trim()),
    tip: '', imgs
  })
}

const missed = Object.keys(OVERRIDES).filter((w) => !usedOv.has(w))
if (missed.length) console.error('⚠ 覆盖表里有清单外的词:', missed.join('、'))

out.sort((a, b) => (a.cat === b.cat ? a.word.localeCompare(b.word, 'zh') : 0))
fs.writeFileSync(path.join(ROOT, 'src/content/vocab.json'), JSON.stringify(out))
console.log(`✓ vocab.json:${out.length} 词;无图 ${noImg},无描述 ${noDesc}`)
const byCat = {}
for (const v of out) byCat[v.cat] = (byCat[v.cat] || 0) + 1
console.log(byCat)
