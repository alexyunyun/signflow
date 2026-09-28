/**
 * SignFlow 本地服务
 * - 托管 dist/ 构建产物
 * - /api/chat:代理 DeepSeek(OpenAI 兼容),支持 SSE 流式透传
 * - /api/health:前端探测服务是否可用、是否已配置 Key
 *
 * Key 读取优先级:请求头 x-api-key(网页设置里填的)> .env / 环境变量 DEEPSEEK_API_KEY
 */
import express from 'express'
import { Readable } from 'node:stream'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 3002)

const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

// ---- 读取 .env(不引入 dotenv 依赖) ----
function loadEnvFile() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      let val = m[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env) || !process.env[key]) process.env[key] = val
    }
  } catch {
    /* .env 不存在则忽略 */
  }
}
loadEnvFile()

const envKey = (process.env.DEEPSEEK_API_KEY || '').trim()
const hasServerKey = envKey.length > 0

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasKey: hasServerKey, model: MODEL })
})

app.post('/api/chat', async (req, res) => {
  const clientKey = (req.get('x-api-key') || '').trim()
  const key = clientKey || envKey

  if (!key) {
    return res.status(401).json({
      error: 'MISSING_KEY',
      message: '还没有配置 DeepSeek API Key。请在网页右上角「设置」里粘贴,或在项目根目录 .env 的 DEEPSEEK_API_KEY= 后面填入并重启服务。'
    })
  }

  const body = { ...req.body, model: req.body?.model || MODEL }

  let upstream
  try {
    upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000)
    })
  } catch (e) {
    return res.status(502).json({
      error: 'UPSTREAM_UNREACHABLE',
      message: `无法连接 DeepSeek 服务(${e?.message || e}),请检查网络后重试。`
    })
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '')
    let message = text
    try {
      const j = JSON.parse(text)
      message = j?.error?.message || j?.message || text
    } catch { /* keep raw text */ }
    return res.status(upstream.status).json({
      error: 'UPSTREAM_ERROR',
      message: `DeepSeek 返回 ${upstream.status}:${String(message).slice(0, 400)}`
    })
  }

  if (body.stream && upstream.body) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()
    try {
      const nodeStream = Readable.fromWeb(upstream.body)
      nodeStream.pipe(res)
      res.on('close', () => nodeStream.destroy())
    } catch {
      res.end()
    }
    return
  }

  res.status(200).json(await upstream.json())
})

// ---- 静态资源 + SPA 兜底 ----
app.use(express.static(DIST))
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
  const index = path.join(DIST, 'index.html')
  if (fs.existsSync(index)) return res.sendFile(index)
  res.status(404).send('未找到构建产物:请先运行 `npm run build`')
})

app.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('  🤟 SignFlow 已启动')
  console.log(`     本机访问: http://localhost:${PORT}`)
  console.log(`     DeepSeek Key: ${hasServerKey ? '✓ 已从 .env / 环境变量读取' : '✗ 未配置(可在网页「设置」里填入)'}`)
  console.log('')
})
