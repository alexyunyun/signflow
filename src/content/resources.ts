// ===== 权威学习资料 =====
export interface Resource {
  name: string
  by: string
  url: string
  desc: string
  tag: '官方' | '课程' | '工具' | '书籍'
}

export const RESOURCES: Resource[] = [
  {
    name: '《国家通用手语词典》APP',
    by: '中国残联组编 · 华夏出版社',
    url: 'https://apps.apple.com/cn/app/id1447603697',
    desc: '手语中的"普通话"。收录 8214 个常用词,每个词都有聋人模特真人视频演示,支持拼音/笔画/手写检索。iOS/安卓应用商店均可下载,部分内容免费。',
    tag: '官方'
  },
  {
    name: '《国家通用手语常用词表》GF 0020—2018',
    by: '教育部 · 国家语委 · 中国残联 发布',
    url: 'http://www.moe.gov.cn/jyb_sjzl/ziliao/A19/201807/W020180725666828831381.pdf',
    desc: '国家语言文字规范原文(官方 PDF),含 5668 个通用手语词目的文字打法描述与动作线图解符号说明。本站词汇打法的权威依据。',
    tag: '官方'
  },
  {
    name: '中国语言文字数字博物馆',
    by: '教育部',
    url: 'https://szyb.smartedu.cn/',
    desc: '免费官方平台,「经典传承」版块收录中国残联制作的国家通用手语资源,包括《国歌》通用手语版等视频。',
    tag: '官方'
  },
  {
    name: '《基础手语》(南京特殊教育师范学院)',
    by: '中国大学 MOOC',
    url: 'https://www.icourse163.org/course/NJTY-1001753186',
    desc: '免费系统课程:手语的语言特征、手指语,以及打招呼、家庭、购物、看病等生活场景的通用手语表达,有聋人老师演示。',
    tag: '课程'
  },
  {
    name: '《手语基础——跟着聋人学手语》(郑州工程技术学院)',
    by: '中国大学 MOOC',
    url: 'https://www.icourse163.org/course/ZHZHU-1002921007',
    desc: '免费课程,由聋人老师主讲:手语的空间特征、类标记、角色转换、句法特点,附 300 多个词汇演示,学完能真正"会说话"。',
    tag: '课程'
  },
  {
    name: '手语翻译图文查询(便民查询网)',
    by: 'bmcx.com',
    url: 'https://shouyu.bmcx.com/',
    desc: '逐词查询手语图解与文字描述的在线工具,本站词汇图解与打法描述即来源于此及《国家通用手语常用词表》,适合随手查。',
    tag: '工具'
  },
  {
    name: '各地残联手语课堂',
    by: '中国残联及地方残联公众号',
    url: 'https://search.bilibili.com/all?keyword=%E6%89%8B%E8%AF%AD%E8%AF%BE%E5%A0%82%20%E6%AE%8B%E8%81%94',
    desc: '红河州、安顺等地残联持续发布"零基础学手语"系列短教学,B 站搜"手语课堂 残联"即可跟练,免费且标准。',
    tag: '课程'
  },
  {
    name: '《中国手语日常会话》',
    by: '华夏出版社',
    url: 'https://book.douban.com/subject/2005829/',
    desc: '按生活场景编写的会话教材,配图解,适合把单词连成句子练;华夏出版社"国家通用手语系列"还有多本专业领域手语书。',
    tag: '书籍'
  }
]
