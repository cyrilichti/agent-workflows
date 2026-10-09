(() => {
  const root = document.querySelector('[data-autonomous-delivery]')
  if (!root) return

  const svg = root.querySelector('.aw-scene')
  const workshop = root.querySelector('.aw-workshop')
  const panel = root.closest('[data-hero-use-panel]')
  const pause = root.querySelector('.aw-pause')
  const playback = root.querySelector('.aw-playback')
  const playbackLabel = root.querySelector('.aw-playback-label')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const events = new AbortController()
  const ns = 'http://www.w3.org/2000/svg'
  const q = Math.sqrt(3) / 2
  const ground = -12
  const transit = 21000
  const cycle = transit + 2400
  const route = 'M 0 0 L 258 0 C 312 0 312 100 258 100 L 42 100 C -12 100 -12 200 42 200 L 300 200'
  const gates = [
    { x: 150, y: 0, name: 'Build' },
    { x: 150, y: 100, name: 'Test' },
    { x: 150, y: 200, name: 'Review' },
  ]
  const palette = { top: 'var(--aw-top)', left: 'var(--aw-left)', right: 'var(--aw-right)' }
  const columns = { top: 'var(--aw-post-top)', left: 'var(--aw-post-left)', right: 'var(--aw-post-right)' }
  const steel = { top: 'var(--aw-steel-top)', left: 'var(--aw-steel-left)', right: 'var(--aw-steel-right)' }
  const toolPalette = { top: steel.left, left: 'var(--aw-belt-side)', right: 'var(--aw-belt-end)' }
  const stages = ['ticket', 'code', 'tested', 'done']
  let paused = reducedMotion.matches
  let visible = false
  let destroyed = false
  let time = 0
  let last = 0
  let raf = 0
  let width = 0
  let scale = 1
  let origin = [0, 0]
  let scene

  function attrs(element, values) {
    for (const [key, value] of Object.entries(values)) {
      const next = String(value)
      if (element.getAttribute(key) !== next) element.setAttribute(key, next)
    }
  }

  function node(tag, values = {}, parent = svg) {
    const element = document.createElementNS(ns, tag)
    attrs(element, values)
    parent.appendChild(element)
    return element
  }

  function project(x, y, z = 0) {
    return [origin[0] + q * scale * (x - y), origin[1] + scale * ((x + y) / 2 - z)]
  }

  function points(vertices) {
    return vertices.map((vertex) => project(...vertex).join(',')).join(' ')
  }

  function polygon(vertices, fill, parent) {
    return node('polygon', { points: points(vertices), fill }, parent)
  }

  function setCuboid(faces, x, y, z, w, d, h, colors) {
    const X = x + w, Y = y + d, Z = z + h
    const vertices = {
      left: [[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]],
      right: [[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]],
      top: [[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]],
    }
    for (const face of ['left', 'right', 'top']) {
      attrs(faces[face], { points: points(vertices[face]), fill: colors[face] })
    }
  }

  function cuboid(x, y, z, w, d, h, colors, parent) {
    const faces = Object.fromEntries(['left', 'right', 'top'].map((face) => [face, node('polygon', {}, parent)]))
    setCuboid(faces, x, y, z, w, d, h, colors)
    return faces
  }

  const ease = (value) => {
    const t = Math.max(0, Math.min(1, value))
    return t * t * (3 - 2 * t)
  }

  function shadow(x, y, w, d, parent, z = 0) {
    return polygon([[x + 3, y + 3, z], [x + w + 6, y + 3, z], [x + w + 6, y + d + 5, z], [x + 3, y + d + 5, z]], 'var(--aw-shadow)', parent)
  }

  function buildGantry(gate, index) {
    const { x, y, name } = gate
    const h = Math.max(16, 12 / scale)
    const back = node('g', {}, scene.volume)
    cuboid(x + 2, y - 34, ground, 12, 10, 66, columns, back)
    cuboid(x + 5, y - 24, 14, 6, 3, 37, steel, back)

    const internal = node('g', { 'data-press': name }, scene.volume)
    cuboid(x + 2, y - 8, 46, 12, 16, 8, steel, internal)
    const shaft = cuboid(x + 6, y - 3, 41, 4, 6, 5, steel, internal)
    const head = node('g', {}, internal)
    cuboid(x, y - 10, 2, 16, 20, 6, steel, head)
    cuboid(x - 1, y - 11, 0, 18, 22, 2, toolPalette, head)

    const front = node('g', {}, scene.volume)
    cuboid(x + 2, y + 24, ground, 12, 10, 66, columns, front)
    cuboid(x + 5, y + 21, 14, 6, 3, 37, steel, front)
    cuboid(x - 4, y - 39, 54, 24, 78, h, palette, front)
    const screen = polygon([[x + 20.1, y - 33, 55.5], [x + 20.1, y + 33, 55.5], [x + 20.1, y + 33, 54 + h - 1.5], [x + 20.1, y - 33, 54 + h - 1.5]], 'var(--aw-sign-front)', front)
    for (const offset of [-35, 35]) cuboid(x + 20.2, y + offset, 57, 1, 2, 2, steel, front)

    const [cx, cy] = project(x + 20.1, y, 54 + h / 2)
    const display = node('g', { 'data-lcd': name, transform: `matrix(${q} -0.5 0 1 ${cx} ${cy})` }, front)
    const textAttrs = { x: 0, y: 3, class: 'aw-lcd-text', 'text-anchor': 'middle', style: `font-size:${Math.max(11, Math.min(13, 11 + (scale - .55) * 3))}px` }
    const glow = node('text', { ...textAttrs, 'aria-hidden': 'true', filter: 'url(#aw-delivery-lcd-glow)', opacity: 0 }, display)
    glow.style.fill = 'var(--aw-sign-lit)'
    glow.textContent = name
    const label = node('text', textAttrs, display)
    label.textContent = name

    scene.fixed.push({ element: back, depth: x + y - 24 }, { element: internal, depth: x + y + 15 }, { element: front, depth: x + y + 43 })
    scene.machines[index] = { internal, shaft, head, screen, display, label, glow, z: null }
  }

  function buildCarton(index) {
    const element = node('g', { 'data-carton': index }, scene.volume)
    const faces = cuboid(-10, -10, 0, 20, 20, .8, { top: 'var(--aw-plan-top)', left: 'var(--aw-plan-left)', right: 'var(--aw-plan-right)' }, element)
    const plan = node('g', {}, element)
    for (const [x, y, w, d] of [[-6, -6, 12, 2.4], [-6, -1, 12, 1.6], [-6, 3, 8, 1.6]]) {
      polygon([[x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0]], 'var(--aw-plan-ink)', plan)
    }
    const tape = node('g', {}, element)
    polygon([[-1, -10, 0], [1, -10, 0], [1, 10, 0], [-1, 10, 0]], 'var(--aw-carton-tape)', tape)
    const badge = node('g', { 'data-checked': 'true', 'aria-hidden': 'true' }, element)
    node('rect', { x: -7 * scale, y: -7 * scale, width: 14 * scale, height: 14 * scale, rx: .8 * scale, fill: 'var(--aw-check)' }, badge)
    const check = node('text', { x: 0, y: .5 * scale, transform: 'rotate(-90)', 'text-anchor': 'middle', 'dominant-baseline': 'middle', style: `font-size:${Math.max(11, 13 * scale)}px;fill:var(--aw-check-ink);font-weight:500` }, badge)
    check.textContent = '✓'
    return { element, faces, plan, tape, badge, shadow: shadow(-10, -10, 20, 20, scene.cartonShadows), height: null }
  }

  // Sample the route once per resize; frames reuse the geometry and SVG nodes.
  function pose(distance) {
    const position = Math.max(0, Math.min(scene.length, distance)) / scene.sampleStep
    const index = Math.min(Math.floor(position), scene.samples.length - 2)
    const a = scene.samples[index], b = scene.samples[index + 1]
    const t = position - index
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, nx: a.nx + (b.nx - a.nx) * t, ny: a.ny + (b.ny - a.ny) * t }
  }

  function draw() {
    const nextWidth = svg.getBoundingClientRect().width
    if (!nextWidth || nextWidth === width || destroyed) return
    width = nextWidth
    scale = Math.min(1.30, (width - 58) / (q * 545))
    const height = Math.round(88 + scale * 288)
    origin = [width / 2 - q * scale * 46, 62]
    attrs(svg, { viewBox: `0 0 ${width} ${height}` })
    svg.replaceChildren()

    const defs = node('defs')
    const blur = node('filter', { id: 'aw-delivery-contact-shadow', x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs)
    node('feGaussianBlur', { stdDeviation: Math.max(.6, scale * .9) }, blur)
    const lcdGlow = node('filter', { id: 'aw-delivery-lcd-glow', x: '-30%', y: '-100%', width: '160%', height: '300%' }, defs)
    node('feGaussianBlur', { stdDeviation: 1.2 }, lcdGlow)
    const path = node('path', { d: route }, defs)
    const length = path.getTotalLength()
    const count = Math.ceil(length * 2)
    scene = { length, sampleStep: length / count, samples: [], fixed: [], machines: [], order: [] }
    for (let i = 0; i <= count; i++) {
      const s = i * scene.sampleStep, p = path.getPointAtLength(s)
      const a = path.getPointAtLength(Math.max(0, s - .5)), b = path.getPointAtLength(Math.min(length, s + .5))
      const magnitude = Math.hypot(b.x - a.x, b.y - a.y)
      scene.samples.push({ x: p.x, y: p.y, nx: -(b.y - a.y) / magnitude, ny: (b.x - a.x) / magnitude })
    }
    scene.gateDistances = gates.map((gate) => {
      let best = 0, error = Infinity
      scene.samples.forEach((sample, index) => {
        const distance = (sample.x - gate.x - 8) ** 2 + (sample.y - gate.y) ** 2
        if (distance < error) { best = index; error = distance }
      })
      return best * scene.sampleStep
    })

    const left = [], right = [], segments = Math.ceil(length / 3)
    for (let i = 0; i <= segments; i++) {
      const p = pose(i * length / segments)
      left.push([p.x + p.nx * 21, p.y + p.ny * 21])
      right.push([p.x - p.nx * 21, p.y - p.ny * 21])
    }
    const outline = [...left, ...right.reverse()]
    const body = node('g', { 'data-conveyor': 'solid' })
    outline.forEach((a, i) => {
      const b = outline[(i + 1) % outline.length], dx = b[0] - a[0], dy = b[1] - a[1]
      if (dx - dy > 0) polygon([[...a, ground], [...b, ground], [...b, 0], [...a, 0]], Math.abs(dy) > Math.abs(dx) ? 'var(--aw-belt-end)' : 'var(--aw-belt-side)', body)
    })
    polygon(outline.map((p) => [...p, 0]), 'var(--aw-belt)', body)
    const belt = node('g', { transform: `matrix(${q * scale} ${scale / 2} ${-q * scale} ${scale / 2} ${origin[0]} ${origin[1]})` })
    scene.seams = Array.from({ length: Math.ceil(length / 16) }, () => node('line', { stroke: 'var(--aw-seam)', 'stroke-width': 1.3 }, belt))
    const shadows = node('g', { opacity: .17, filter: 'url(#aw-delivery-contact-shadow)' })
    gates.forEach((gate) => {
      shadow(gate.x, gate.y - 33, 17, 13, shadows, ground)
      shadow(gate.x, gate.y + 23, 17, 13, shadows, ground)
    })
    scene.cartonShadows = node('g', {}, shadows)
    scene.volume = node('g')
    gates.forEach(buildGantry)
    scene.cartons = Array.from({ length: 4 }, (_, index) => buildCarton(index))
    update()
  }

  function update() {
    if (!scene) return
    const travel = time / transit * scene.length
    scene.seams.forEach((seam, i) => {
      const p = pose((i * scene.length / scene.seams.length + travel) % scene.length)
      attrs(seam, { x1: p.x + p.nx * 19, y1: p.y + p.ny * 19, x2: p.x - p.nx * 19, y2: p.y - p.ny * 19 })
    })
    const objects = [...scene.fixed], presses = [0, 0, 0], lights = [0, 0, 0]
    let buildContact = .8
    scene.cartons.forEach((carton, index) => {
      const age = (time + [.04, .29, .54, .89][index] * cycle) % cycle
      const distance = Math.min(age / transit, 1) * scene.length
      const p = pose(distance)
      let z = 0, opacity = ease(age / 320), phase = 'conveying'
      if (age > transit) {
        const out = age - transit
        p.x += 24 * ease(out / 450)
        z = ground * ease((out - 450) / 650)
        opacity = 1 - ease((out - 1500) / 900)
        phase = out < 1100 ? 'landing' : out < 1500 ? 'landed' : 'fading'
      }
      scene.gateDistances.forEach((s, i) => {
        const delta = distance - s
        presses[i] = Math.max(presses[i], delta < 0 ? ease((delta + 15) / 15) : 1 - ease(delta / 15))
        lights[i] = Math.max(lights[i], ease((28 - Math.abs(delta)) / 14))
      })
      const passed = scene.gateDistances.filter((s) => distance >= s).length
      const prefix = stages[passed]
      const formation = ease((distance - scene.gateDistances[0] + 8) / (scene.length / transit * 180))
      const height = .8 + 15.2 * formation
      if (Math.abs(distance - scene.gateDistances[0]) < 15) buildContact = height
      const blend = passed ? ease((distance - scene.gateDistances[passed - 1]) / (scene.length / transit * (passed === 1 ? 450 : 320))) : 1
      const previous = stages[Math.max(0, passed - 1)]
      const colors = Object.fromEntries(['top', 'left', 'right'].map((face) => {
        const fill = blend >= 1 ? `var(--aw-${prefix}-${face})` : `color-mix(in srgb,var(--aw-${previous}-${face}) ${(100 - blend * 100).toFixed(2)}%,var(--aw-${prefix}-${face}))`
        return [face, formation >= 1 ? fill : `color-mix(in srgb,var(--aw-plan-${face}) ${(100 - formation * 100).toFixed(2)}%,var(--aw-${prefix}-${face}))`]
      }))
      if (carton.height !== height) {
        setCuboid(carton.faces, -10, -10, 0, 20, 20, height, colors)
        attrs(carton.plan, { transform: `translate(0 ${-scale * (height + .1)})` })
        attrs(carton.tape, { transform: `translate(0 ${-scale * (height + .1)})` })
        attrs(carton.badge, { transform: `matrix(${q} 0.5 ${-q} 0.5 ${origin[0]} ${origin[1] - scale * (height + .2)})` })
        carton.height = height
      } else {
        for (const face of ['top', 'left', 'right']) attrs(carton.faces[face], { fill: colors[face] })
      }
      const [cx, cy] = project(p.x, p.y, z)
      attrs(carton.element, { transform: `translate(${cx - origin[0]} ${cy - origin[1]})`, opacity: opacity.toFixed(3), 'data-stage': prefix, 'data-form': formation === 0 ? 'plan' : formation < 1 ? 'forming' : 'artifact', 'data-phase': phase })
      attrs(carton.plan, { opacity: (1 - formation).toFixed(3) })
      attrs(carton.tape, { opacity: formation.toFixed(3) })
      attrs(carton.badge, { opacity: passed === 3 ? blend.toFixed(3) : 0 })
      const [sx, sy] = project(p.x, p.y, age > transit + 450 ? ground : 0)
      attrs(carton.shadow, { transform: `translate(${sx - origin[0]} ${sy - origin[1]})`, opacity: opacity * (age > transit + 450 ? .5 + .5 * ease((age - transit - 450) / 650) : 1) })
      objects.push({ element: carton.element, depth: p.x + p.y })
    })
    scene.machines.forEach((machine, i) => {
      const contact = i === 0 ? buildContact : 16
      const z = 35 - (35 - contact) * presses[i]
      if (machine.z !== z) {
        attrs(machine.head, { transform: `translate(0 ${-scale * z})` })
        setCuboid(machine.shaft, gates[i].x + 6, gates[i].y - 3, z + 6, 4, 6, 46 - z - 6, steel)
        machine.z = z
      }
      attrs(machine.internal, { 'data-stroke': presses[i].toFixed(3) })
      attrs(machine.screen, { fill: `color-mix(in srgb,var(--aw-sign-lit) ${(lights[i] * 5).toFixed(2)}%,var(--aw-sign-front))` })
      attrs(machine.display, { 'data-lit': String(lights[i] > .08) })
      machine.label.style.fill = `color-mix(in srgb,var(--aw-sign-lit) ${(lights[i] * 100).toFixed(2)}%,var(--aw-sign-ink))`
      attrs(machine.glow, { opacity: (lights[i] * .85).toFixed(3) })
    })
    // Change stacking only when a carton passes a gantry, rather than rebuilding the scene.
    const order = objects.sort((a, b) => a.depth - b.depth).map((object) => object.element)
    if (order.some((element, i) => element !== scene.order[i])) {
      order.forEach((element) => scene.volume.appendChild(element))
      scene.order = order
    }
  }

  function renderState() {
    pause.textContent = paused ? 'Resume' : 'Pause'
    pause.setAttribute('aria-pressed', String(paused))
    playback.dataset.playing = String(!paused)
    playbackLabel.textContent = paused ? 'Paused' : 'Playing'
  }

  function canAnimate() {
    return !destroyed && !paused && visible && !panel?.hidden && !document.hidden
  }

  function syncMotion() {
    cancelAnimationFrame(raf)
    raf = 0
    last = 0
    if (canAnimate()) raf = requestAnimationFrame(frame)
  }

  function frame(now) {
    raf = 0
    if (!canAnimate()) { last = 0; return }
    if (last) { time += Math.min(now - last, 80); update() }
    last = now
    raf = requestAnimationFrame(frame)
  }

  function listen(target, name, callback) {
    target.addEventListener(name, callback, { signal: events.signal })
  }

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    playback.classList.toggle('aw-playback--inactive', !visible)
    syncMotion()
  })
  const resize = new ResizeObserver(draw)

  function destroy() {
    destroyed = true
    cancelAnimationFrame(raf)
    resize.disconnect()
    intersection.disconnect()
    events.abort()
  }

  listen(pause, 'click', () => { paused = !paused; renderState(); syncMotion() })
  listen(window, 'hero-use-case-change', () => { draw(); syncMotion() })
  listen(reducedMotion, 'change', () => {
    if (reducedMotion.matches) { paused = true; renderState(); syncMotion() }
  })
  listen(document, 'visibilitychange', syncMotion)
  listen(document, 'astro:before-swap', destroy)
  listen(window, 'pagehide', (event) => { if (!event.persisted) destroy() })
  listen(window, 'pageshow', syncMotion)
  intersection.observe(workshop)
  resize.observe(svg)
  draw()
  renderState()
})()
