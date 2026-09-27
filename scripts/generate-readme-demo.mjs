import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'

// Regenerate with `node scripts/generate-readme-demo.mjs` (requires ImageMagick).
// Conversation text comes from the documentation home page.
const source = await readFile(new URL('../docs/index.md', import.meta.url), 'utf8')
const output = new URL('../public/readme-workflow-demo.gif', import.meta.url)
const sceneMarkup = [...source.matchAll(/<article class="workflow-demo__scene" data-demo-scene>([\s\S]*?)<\/article>/g)]
const steps = ['Shape', 'Plan', 'Build', 'Review', 'Merge']
const mechanisms = [
  '/write · clarify the request',
  'Linear · /plan · approval',
  '/work · checks · /ready',
  '/inspect · reviewer',
  '/done · Linear complete',
]

if (sceneMarkup.length !== steps.length) {
  throw new Error(`Expected ${steps.length} demo scenes, found ${sceneMarkup.length}`)
}

function plainText(markup) {
  return markup.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').trim()
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function requiredMatch(markup, pattern, label) {
  const match = markup.match(pattern)
  if (!match) throw new Error(`Missing ${label} in documentation demo`)
  return plainText(match[1])
}

const scenes = sceneMarkup.map(([, markup], index) => ({
  phase: requiredMatch(markup, /<p class="workflow-demo__phase">([^<]+)<\/p>/, 'phase'),
  user: markup.match(/<div class="workflow-demo__message workflow-demo__message--user"><b>You<\/b><p data-demo-typing>([^<]+)<\/p><\/div>/)?.[1] ?? null,
  agent: requiredMatch(markup, /<div class="workflow-demo__message workflow-demo__message--agent"[^>]*><b>Agent<\/b><p(?: data-demo-typing)?>([^<]+)<\/p><\/div>/, 'agent message'),
  mechanism: mechanisms[index],
}))

function wrap(text, maxLength = 49) {
  const lines = ['']
  for (const word of text.split(/\s+/)) {
    const last = lines.length - 1
    if (lines[last] && `${lines[last]} ${word}`.length > maxLength) lines.push(word)
    else lines[last] += `${lines[last] ? ' ' : ''}${word}`
  }
  return lines
}

function message(label, text, y, user = false) {
  const lines = wrap(plainText(text))
  const height = 51 + lines.length * 31
  const fill = user ? '#172d48' : '#151b27'
  const stroke = user ? '#40648a' : '#354150'
  const textLines = lines.map((line, index) => `<text x="92" y="${y + 64 + index * 31}" class="body">${escapeXml(line)}</text>`).join('')
  return {
    height,
    svg: `<rect x="54" y="${y}" width="692" height="${height}" rx="15" fill="${fill}" stroke="${stroke}"/>
      <text x="76" y="${y + 34}" class="label">${label}</text>${textLines}`,
  }
}

function frame(scene, index) {
  let y = 155
  const bubbles = []
  if (scene.user) {
    const user = message('YOU', scene.user, y, true)
    bubbles.push(user.svg)
    y += user.height + 12
  }
  const agent = message('AGENT', scene.agent, y)
  bubbles.push(agent.svg)
  const progress = steps.map((step, stepIndex) => {
    const x = 104 + stepIndex * 148
    const active = stepIndex === index
    return `<circle cx="${x}" cy="81" r="12" fill="${active ? '#86b9ff' : '#283648'}" stroke="${active ? '#b8d8ff' : '#526477'}"/>
      <text x="${x}" y="86" text-anchor="middle" class="number" fill="${active ? '#111a28' : '#bdc9d4'}">${stepIndex + 1}</text>
      <text x="${x}" y="111" text-anchor="middle" class="step" fill="${active ? '#d6e9ff' : '#9baaba'}">${step}</text>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
    <defs>
      <style>
        text { font-family: Arial, Helvetica, sans-serif; }
        .brand { font-size: 17px; fill: #b9c9d9; font-weight: 600; }
        .step { font-size: 16px; font-weight: 600; }
        .number { font-size: 14px; font-weight: 700; }
        .phase { font-size: 25px; fill: #b8d8ff; font-weight: 700; }
        .label { font-size: 16px; fill: #9dc6f8; font-weight: 700; letter-spacing: 1px; }
        .body { font-size: 23px; fill: #f5f7fb; }
        .aside-label { font-size: 15px; fill: #a4b5c6; font-weight: 700; letter-spacing: 1px; }
        .aside { font-size: 20px; fill: #d7e6fa; }
      </style>
    </defs>
    <rect width="800" height="520" rx="20" fill="#111b2a"/>
    <rect x="1" y="1" width="798" height="518" rx="19" fill="none" stroke="#394b5d" stroke-width="2"/>
    <circle cx="28" cy="29" r="5" fill="#72848e"/><circle cx="47" cy="29" r="5" fill="#72848e"/><circle cx="66" cy="29" r="5" fill="#86b9ff"/>
    <text x="89" y="35" class="brand">agent-workflows / demo</text>
    <text x="746" y="35" text-anchor="end" class="brand">${index + 1} / ${steps.length}</text>
    <line x1="104" y1="81" x2="696" y2="81" stroke="#40556d" stroke-width="3"/>
    ${progress}
    <text x="54" y="143" class="phase">${escapeXml(scene.phase)}</text>
    ${bubbles.join('')}
    <rect x="54" y="451" width="692" height="48" rx="11" fill="#202c3c"/>
    <text x="70" y="480" class="aside-label">BEHIND THE SCENES</text>
    <text x="291" y="480" class="aside">${escapeXml(scene.mechanism)}</text>
  </svg>`
}

const temp = await mkdtemp(join(tmpdir(), 'readme-demo-'))
try {
  const frames = []
  for (const [index, scene] of scenes.entries()) {
    const path = join(temp, `${index}.png`)
    await sharp(Buffer.from(frame(scene, index))).png().toFile(path)
    frames.push(path)
  }
  const args = []
  for (const [index, path] of frames.entries()) args.push('-delay', index === frames.length - 1 ? '400' : '300', path)
  args.push('-loop', '0', '-colors', '96', output.pathname)
  const result = spawnSync('magick', args, { encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr || 'ImageMagick failed')
} finally {
  await rm(temp, { recursive: true, force: true })
}
