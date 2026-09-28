# SignFlow · 手语学习 🤟

基于**国家通用手语**的日常手语学习网站:图解词汇 · 日常语句 · 间隔复习 · AI 助教。
极简手绘风、浅色系,学习进度保存在本机浏览器。

![tech](https://img.shields.io/badge/Vite%20%2B%20React%20%2B%20TS-手绘风-f2c84b)

## 功能

- **全量词库**:5200+ 词(覆盖《中国手语》体系完整词典,54 个来源分类归并为 15 个主题),每词配打法文字描述,支持词语/拼音/描述搜索
- **图解**:部分词配示意图(陆续补充),每词可直达视频教学
- **学习闪卡**:按分类学新词,先回想再翻面,每日新词量可调
- **间隔复习(SRS)**:三种题型(看词回忆打法 / 看图猜词 / 看步骤猜词),忘了/模糊/记住了三档评分,按记忆曲线自动排期,忘了的卡当轮重排
- **日常语句**:10 个场景 39 句常用语,手语语序逐词展开(词库里的词直接内联手势图),附语法提示
- **AI 助教**(DeepSeek):问任意词句的打法、汉语转手语语序、语法与文化问答、出小测验
- **权威资料**:官方词典 APP、国家规范 PDF(常用词表/手指字母方案/国歌手语方案)、MOOC 课程直达
- **进度管理**:localStorage 保存,支持导出/导入 JSON

## 运行

```bash
npm install

# 方式一(推荐):本地服务,同时托管页面和 AI 代理
npm run build
npm start            # → http://localhost:3002

# 方式二:开发模式(热更新),另开终端跑 npm run server
npm run dev          # → http://localhost:5174
```

AI 助教需要 DeepSeek API Key,两种填法任选:

1. 网页右上角「设置」里粘贴(存浏览器 localStorage,请求由你的设备直发 DeepSeek);
2. 项目根目录 `.env` 里 `DEEPSEEK_API_KEY=sk-...` 后重启服务(请求经本地服务转发)。

URL 加 `?demo=1` 进入演示模式,无需 Key 即可预览交互。

## 内容说明(重要)

- 词汇打法文字描述整理自《国家通用手语常用词表》(GF 0020—2018,教育部/国家语委/中国残联发布)及公开手语资料(便民查询网手语词典等),图解为示意图,仅供个人学习。
- 手语存在地域差异,个别词打法可能随词典修订更新,**请以《国家通用手语词典》APP 的真人视频为准**(每个词条都有直达链接)。
- 本项目仅个人学习用途,不用于商业或再分发。

## 数据维护

词汇数据由脚本生成,全量管道(可断点续传):

```bash
python3 scripts/crawl-bmcx.py           # 爬全量词条 → data-src/bmcx-full.tsv
python3 scripts/crawl-bmcx.py --images  # 下载图解 → public/signs/w{wid}.png
python3 scripts/gen-pinyin.py           # 生成 data-src/pinyin-full.json
npm run vocab                           # 合并精选覆盖 → src/content/vocab.json
```

- `data-src/vocab-meta.tsv`:人工精选词条(词|分类|记忆钩子),构建时优先采用并保留多图;
- `data-src/desc-overrides.json`:人工校订的描述覆盖表;
- 图片来自公开图文库,扩展名为 .png 但内容可能是 PNG/JPEG/WEBP(校验按文件头)。


## 部署说明

私有仓库无法使用免费版 GitHub Pages(Pages 仅支持公开仓库)。`.github/workflows/deploy.yml` 已就绪:把仓库转为公开后,push 到 main 即自动部署到 Pages;私有状态下请用 `npm start` 本机运行。
