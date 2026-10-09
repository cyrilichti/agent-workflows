const heroUseCases = document.querySelector('[data-hero-use-cases]')
const demo = heroUseCases?.querySelector('[data-workflow-demo]')

if (heroUseCases) {
  const tabs = [...heroUseCases.querySelectorAll('[data-hero-use-tab]')]
  const panels = [...heroUseCases.querySelectorAll('[data-hero-use-panel]')]
  const hero = heroUseCases.closest('.hero')
  const tagline = hero?.querySelector('.tagline')
  const secondaryAction = hero?.querySelector('.actions a:nth-child(2)')

  function selectUseCase(nextTab, moveFocus = false) {
    tabs.forEach((tab) => {
      const selected = tab === nextTab
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
      if (selected && moveFocus) tab.focus()
    })

    panels.forEach((panel) => {
      const selected = panel.id === nextTab.getAttribute('aria-controls')
      panel.hidden = !selected
      if (!selected) return
      if (tagline) tagline.textContent = panel.dataset.heroTagline
      if (secondaryAction) {
        secondaryAction.textContent = panel.dataset.heroLinkLabel
        secondaryAction.href = panel.dataset.heroLinkHref
      }
      window.dispatchEvent(new CustomEvent('hero-use-case-change', {
        detail: { view: panel.dataset.heroView },
      }))
    })
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectUseCase(tab))
    tab.addEventListener('keydown', (event) => {
      let nextIndex
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
      else if (event.key === 'Home') nextIndex = 0
      else if (event.key === 'End') nextIndex = tabs.length - 1
      else return
      event.preventDefault()
      selectUseCase(tabs[nextIndex], true)
    })
  })

  selectUseCase(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabs[0])
}

if (demo) {
  const scenes = [...demo.querySelectorAll('[data-demo-scene]')]
  const transcript = demo.querySelector('.workflow-demo__scenes')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const userMessages = scenes.map((scene) => scene.querySelector('[data-demo-typing]'))
  const fullMessages = userMessages.map((message) => message.textContent)
  let active = 0
  let timer
  let typingTimer

  function clearTimers() {
    window.clearTimeout(timer)
    window.clearInterval(typingTimer)
  }

  function showStatic() {
    clearTimers()
    demo.classList.remove('workflow-demo--animated')
    scenes.forEach((scene, index) => {
      scene.hidden = false
      const answer = scene.querySelector('[data-demo-answer]')
      if (answer) answer.hidden = false
      scene.querySelector('[data-demo-behind]').hidden = false
      userMessages[index].textContent = fullMessages[index]
      userMessages[index].classList.remove('workflow-demo__typing')
    })
    transcript.scrollTop = 0
  }

  function followConversation(smooth = false) {
    transcript.scrollTo({
      top: transcript.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  function scheduleNext(delay) {
    timer = window.setTimeout(() => {
      if (demo.querySelector('a:hover') || demo.contains(document.activeElement)) {
        scheduleNext(1000)
      } else {
        showScene((active + 1) % scenes.length)
      }
    }, delay)
  }

  function showScene(index) {
    clearTimers()
    active = index
    if (index === 0) {
      scenes.forEach((scene) => { scene.hidden = true })
      transcript.scrollTop = 0
    }

    const scene = scenes[index]
    const message = userMessages[index]
    const answer = scene.querySelector('[data-demo-answer]')
    const behind = scene.querySelector('[data-demo-behind]')
    const characters = [...fullMessages[index]]
    let position = 0

    message.textContent = ''
    message.classList.add('workflow-demo__typing')
    if (answer) answer.hidden = true
    behind.hidden = true
    scene.hidden = false
    followConversation(true)
    typingTimer = window.setInterval(() => {
      position = Math.min(position + 1, characters.length)
      message.textContent = characters.slice(0, position).join('')
      followConversation()
      if (position === characters.length) {
        window.clearInterval(typingTimer)
        message.classList.remove('workflow-demo__typing')
        timer = window.setTimeout(() => {
          if (answer) answer.hidden = false
          followConversation(true)
          timer = window.setTimeout(() => {
            behind.hidden = false
            followConversation(true)
            scheduleNext(active === scenes.length - 1 ? 9000 : 7000)
          }, 450)
        }, 300)
      }
    }, 38)
  }

  function setMode(activeView = 'conversation') {
    if (activeView !== 'conversation' || reducedMotion.matches) showStatic()
    else {
      demo.classList.add('workflow-demo--animated')
      showScene(0)
    }
  }

  window.addEventListener('hero-use-case-change', (event) => setMode(event.detail.view))
  reducedMotion.addEventListener('change', () => {
    const conversationPanel = demo.closest('[data-hero-use-panel]')
    setMode(conversationPanel?.hidden ? 'orchestration' : 'conversation')
  })
  setMode()
}

const orchestrationDemo = heroUseCases?.querySelector('[data-orchestration-demo]')

if (orchestrationDemo) {
  const phases = ['ticket', 'to-work', 'work', 'to-increment', 'increment', 'return']
  const phaseMessages = {
    ticket: 'A ready, planned ticket is selected.',
    'to-work': 'The approved plan enters delivery.',
    work: 'Implementation, checks, review, and correction run together.',
    'to-increment': 'Reviewed work becomes an increment.',
    increment: 'The increment now awaits a human merge decision.',
    return: 'The orchestrator returns for the next eligible ticket.',
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const phaseElements = [...orchestrationDemo.querySelectorAll('[data-orchestration-step]')]
  const conveyor = orchestrationDemo.querySelector('[data-orchestration-conveyor]')
  const increments = orchestrationDemo.querySelector('[data-orchestration-increments]')
  const status = orchestrationDemo.querySelector('[data-orchestration-status]')
  const pauseButton = orchestrationDemo.querySelector('[data-orchestration-pause]')
  let phaseIndex = 0
  let produced = 0
  let timer
  let running = false
  let paused = false

  function clearOrchestrationTimer() {
    window.clearTimeout(timer)
  }

  function renderIncrements() {
    increments.replaceChildren(...Array.from({ length: Math.min(produced, 4) }, () => {
      const increment = document.createElement('i')
      increment.setAttribute('aria-hidden', 'true')
      return increment
    }))
  }

  function showOrchestrationPhase() {
    const phase = phases[phaseIndex]
    phaseElements.forEach((element) => {
      element.classList.toggle('is-active', element.dataset.orchestrationStep === phase)
    })
    conveyor.classList.toggle('is-active', phase === 'return')
    status.textContent = phaseMessages[phase]
    if (phase === 'increment') {
      produced += 1
      renderIncrements()
    }
  }

  function scheduleOrchestrationPhase() {
    clearOrchestrationTimer()
    if (!running || paused || reducedMotion.matches) return
    timer = window.setTimeout(() => {
      phaseIndex = (phaseIndex + 1) % phases.length
      showOrchestrationPhase()
      scheduleOrchestrationPhase()
    }, 1350)
  }

  function showOrchestrationStatic() {
    clearOrchestrationTimer()
    running = false
    paused = false
    phaseElements.forEach((element) => element.classList.add('is-active'))
    conveyor.classList.remove('is-active')
    produced = Math.max(produced, 2)
    renderIncrements()
    status.textContent = 'Ready, planned tickets produce reviewed increments for a human merge decision.'
    pauseButton.disabled = true
    pauseButton.setAttribute('aria-pressed', 'false')
    pauseButton.textContent = 'Reduced motion'
  }

  function setOrchestrationMode(activeView = 'conversation') {
    clearOrchestrationTimer()
    running = activeView === 'orchestration'
    if (!running) return
    if (reducedMotion.matches) {
      showOrchestrationStatic()
      return
    }
    pauseButton.disabled = false
    pauseButton.textContent = paused ? 'Resume' : 'Pause'
    showOrchestrationPhase()
    scheduleOrchestrationPhase()
  }

  pauseButton.addEventListener('click', () => {
    paused = !paused
    pauseButton.setAttribute('aria-pressed', String(paused))
    pauseButton.textContent = paused ? 'Resume' : 'Pause'
    if (paused) clearOrchestrationTimer()
    else scheduleOrchestrationPhase()
  })

  window.addEventListener('hero-use-case-change', (event) => setOrchestrationMode(event.detail.view))
  reducedMotion.addEventListener('change', () => {
    const orchestrationPanel = orchestrationDemo.closest('[data-hero-use-panel]')
    setOrchestrationMode(orchestrationPanel?.hidden ? 'conversation' : 'orchestration')
  })
  setOrchestrationMode()
}
