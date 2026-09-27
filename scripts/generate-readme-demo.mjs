import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// Record the documentation's actual HTML/CSS/JS animation without opening a tab.
// Run: node scripts/generate-readme-demo.mjs (requires Chrome and ImageMagick).
const root = new URL('../', import.meta.url)
const docs = await readFile(new URL('docs/index.md', root), 'utf8')
const css = await readFile(new URL('docs/styles/custom.css', root), 'utf8')
const js = await readFile(new URL('public/workflow-demo.js', root), 'utf8')
const demo = docs.match(/<section class="workflow-demo"[\s\S]*?<\/section>/)?.[0]
if (!demo) throw new Error('Documentation demo not found')

const temp = await mkdtemp(join(tmpdir(), 'readme-workflow-demo-'))
const profile = join(temp, 'chrome')
const page = join(temp, 'demo.html')
const output = new URL('public/readme-workflow-demo.gif', root).pathname
await writeFile(page, `<!doctype html><html data-theme="dark"><head><meta charset="utf-8"><style>
* { box-sizing: border-box; } html, body { width: 496px; height: 368px; margin: 0; }
body { font-family: var(--sl-font); } ${css}
</style></head><body>${demo}<script>${js}</script></body></html>`)

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=496,368',
  'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let socket
try {
  let port
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]
      break
    } catch {
      if (chrome.exitCode !== null) throw new Error('Chrome exited before starting')
      await sleep(100)
    }
  }
  if (!port) throw new Error('Chrome debugging port unavailable')
  const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()
  socket = new WebSocket(webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  let nextId = 1
  const pending = new Map()
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (!message.id || !pending.has(message.id)) return
    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result)
  })
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send('Runtime.enable', {}, sessionId)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 496, height: 368, deviceScaleFactor: 1, mobile: false,
  }, sessionId)
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  }, sessionId)
  await send('Page.navigate', { url: pathToFileURL(page).href }, sessionId)

  const state = async () => {
    const { result } = await send('Runtime.evaluate', {
      expression: `(() => { const scenes = [...document.querySelectorAll('[data-demo-scene]')]; return scenes.length === 5 ? scenes.findLastIndex(scene => !scene.hidden) : -1 })()`,
      returnByValue: true,
    }, sessionId)
    return result.value
  }
  while (await state() < 0) await sleep(50)

  const frames = []
  let lastHash
  let previousCaptureAt
  let sawFinalScene = false
  const started = Date.now()
  while (Date.now() - started < 75_000) {
    const current = await state()
    if (current === 4) sawFinalScene = true
    if (sawFinalScene && current === 0) break
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId)
    const captureAt = Date.now()
    if (sawFinalScene && await state() === 0) break
    if (previousCaptureAt) frames.at(-1).delay += Math.max(1, Math.round((captureAt - previousCaptureAt) / 10))
    const bytes = Buffer.from(data, 'base64')
    const hash = createHash('sha256').update(bytes).digest('hex')
    if (hash !== lastHash) {
      const path = join(temp, `${frames.length}.png`)
      await writeFile(path, bytes)
      frames.push({ path, delay: 0 })
      lastHash = hash
    }
    previousCaptureAt = captureAt
    await sleep(200)
  }
  if (!sawFinalScene) throw new Error('The demo did not reach its final scene')
  frames.at(-1).delay += Math.max(1, Math.round((Date.now() - previousCaptureAt) / 10))

  const args = frames.flatMap(({ path, delay }) => ['-delay', String(delay), path])
  args.push('-loop', '0', '-colors', '128', output)
  const conversion = spawnSync('magick', args, { encoding: 'utf8' })
  if (conversion.status !== 0) throw new Error(conversion.stderr || 'GIF conversion failed')
  process.stdout.write(`Recorded ${frames.length} distinct frames from the documentation demo.\n`)
} finally {
  socket?.close()
  chrome.kill()
  if (chrome.exitCode === null) await new Promise((resolve) => chrome.once('exit', resolve))
  await rm(temp, { recursive: true, force: true })
}
