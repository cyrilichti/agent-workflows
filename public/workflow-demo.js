const demo = document.querySelector('[data-workflow-demo]')

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

  function setMode() {
    if (reducedMotion.matches) showStatic()
    else {
      demo.classList.add('workflow-demo--animated')
      showScene(0)
    }
  }

  reducedMotion.addEventListener('change', setMode)
  setMode()
}
