function getValidIndex (index, list) {
  return Math.min(Math.max(index, 0), list.length - 1)
}

function styleForId (id) {
  return document.getElementById(id).style
}

function escapeHtml (html) {
  const text = document.createTextNode(html)
  const p = document.createElement('p')
  p.appendChild(text)
  return p.innerHTML
}

class App {
  constructor () {
    // [BUG] Audio.play() result in exception when it is called with no user interaction after window.load
    // See https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
    this.initialized = false
    this.cardProceeded = false
  }

  getCardIndexFor (where) {
    if (where === 'top') return 0

    let delta
    if (where === 'end') delta = Infinity
    else if (where === 'next') delta = 1
    else if (where === 'previous') delta = -1
    else if (where === 'refresh') delta = 0

    return getValidIndex(this.index + delta, this.wordList)
  }

  getCard () {
    return this.wordList[this.index] || {}
  }

  playOrStopAudio () {
    if (!this.audio) return

    if (this.audio.paused) this.audio.play()
    else this.audio.pause()
  }

  playAudio (...fieldNumbers) {
    if (!this.initialized) return

    // Stop previous sound before playing new one.
    if (this.audio) {
      this.audio.pause()
      this.audio.onended = null
      this.audio = null
    }

    const word = this.getCard().word
    if (!word) return

    const audioFiles = fieldNumbers.map(n => this.getAudioFile(word, n)).filter(v => v)

    const playAudios = files => {
      if (files.length) {
        this.audio = new Audio(files.shift())
        this.audio.onended = () => playAudios(files)
        this.audio.play()
      }
    }
    playAudios(audioFiles)
  }

  getAudioFile (word, fieldNo) {
    return `sounds/${word}-${fieldNo}.wav`
  }

  setCard (where) {
    this.index = this.getCardIndexFor(where)
    const { word = '', definition = '' } = this.getCard()
    this.updateFieldVisibility({ caption: false, word: false, definition: false })

    if (!word) {
      document.getElementById('word').innerText = 'EMPTY!'
      document.getElementById('definition').innerHTML = '&#8595; Scroll down and drop your file.'
      this.updateFieldVisibility({ word: true, definition: true, caption: true, image: false })
    } else {
      document.getElementById('word').innerText = word
      document.getElementById('definition').innerText = definition.replace(/<br>/g, '\n')
      this.updateFieldVisibility(this.defaultVisible)
    }

    if (word && Config.searchSystemDictionary) {
      this.searchSystemDictionary(word)
    }

    this.cardProceeded = false
    this.renderProgress()
  }

  renderProgress () {
    const total = this.wordList.length
    const current = this.index + 1
    document.getElementById('progress-counter').innerText = `${current} / ${total}`
  }

  getImageUrl () {
    const word = this.getCard().word
    return word ? `url('imgs/${this.getCard().word}.png')` : ''
  }

  updateFieldVisibility (state) {
    const wordWasVisible = this.isVisible('word')
    const definitionWasVisible = this.isVisible('definition')

    for (const field of Object.keys(state)) {
      const value = state[field]
      switch (field) {
        case 'image':
          document.body.style.backgroundImage = value ? this.getImageUrl() : ''
          break
        case 'caption':
          styleForId(field).display = value ? 'block' : 'none'
          break
        default:
          styleForId(field).visibility = value ? '' : 'hidden'
      }
    }

    if (Config.playAudio) {
      let audioFields = []
      if (!wordWasVisible && this.isVisible('word')) audioFields.push(1)
      if (!definitionWasVisible && this.isVisible('definition')) audioFields.push(2)

      audioFields = audioFields.filter(v => Config.playAudioFields.includes(v))
      if (audioFields.length) {
        this.playAudio(...audioFields)
      }
    }
  }

  toggleShow (field) {
    const newValue = !this.defaultVisible[field]
    this.defaultVisible[field] = newValue
    const obj = {}
    obj[field] = newValue
    this.updateFieldVisibility(obj)
  }

  // for caption, word, definition
  isVisible (id) {
    const element = document.getElementById(id)
    if (id === 'caption') {
      return element.style.display !== 'none'
    } else {
      // Check parent's(= caption) visibility and element's itself.
      return element.offsetParent !== null && element.style.visibility !== 'hidden'
    }
  }

  next () {
    const captionStyle = styleForId('caption')
    this.cardProceeded = true

    if (!this.isVisible('caption')) {
      this.updateFieldVisibility({ caption: true })
      return
    }
    if (!document.body.style.backgroundImage) {
      this.updateFieldVisibility({ image: true })
      return
    }
    if (!this.isVisible('word') || !this.isVisible('definition')) {
      this.updateFieldVisibility({ word: true, definition: true })
      return
    }
    if (this.index < this.wordList.length - 1) {
      this.setCard('next')
    }
  }

  previous () {
    if (this.cardProceeded) {
      this.setCard('refresh')
    } else {
      app.setCard('previous')
    }
  }

  getRemovedWordList () {
    return this.removeHistory.map(e => e.item)
  }

  getBlobForActiveWordList () {
    const content = this.wordList.map(e => `${e.word}\t${e.definition}`).join('\n') + '\n'
    return new Blob([content], { type: 'text/plain' })
  }

  getBlobForRemovedWordList () {
    const content = this.getRemovedWordList.map(e => `${e.word}\t${e.definition}`).join('\n') + '\n'
    return new Blob([content], { type: 'text/plain' })
  }

  deleteCurrentWord () {
    if (this.wordList.length) {
      const removed = this.wordList.splice(this.index, 1)[0]
      this.removeHistory.push({ item: removed, index: this.index })
      this.refresh()
    }
  }

  refresh () {
    this.setCard('refresh')
    this.renderActiveWordList()
    this.renderRemovedWordList()
  }

  undoDeletion () {
    if (this.removeHistory.length) {
      const { item, index } = this.removeHistory.pop()
      this.wordList.splice(index, 0, item)
      this.index = index
      this.refresh()
    }
  }

  showHelp () {
    const container = document.getElementById('help')
    if (container.style.display !== 'none') {
      container.style.display = 'none'
    } else {
      container.style.display = 'block'
    }
  }

  renderWordList (targetId, wordList = []) {
    const container = document.getElementById(targetId)
    container.value = wordList.map(e => e.word + '\t' + e.definition).join('\n') + '\n'
  }

  renderActiveWordList () {
    this.renderWordList('active-words', this.wordList)
  }
  renderRemovedWordList () {
    this.renderWordList('removed-words', this.getRemovedWordList())
  }

  searchImageNow () {
    const card = this.getCard()
    if (card && card.word) {
      const a = document.getElementById('image-search')
      a.href = 'https://www.google.com/search?gl=us&hl=en&pws=0&gws_rd=cr&tbm=isch&q=' + card.word
      a.click()
    }
  }

  getDefaultState () {
    return {
      index: -1,
      wordList: [],
      wordListFilename: '',
      removeHistory: [],
      defaultVisible: {
        word: true,
        definition: false,
        caption: false,
        image: true
      }
    }
  }

  setState (state = {}) {
    Object.assign(this, this.getDefaultState(), state)
    this.refresh()
  }

  getState () {
    return {
      index: this.index,
      wordList: this.wordList,
      wordListFilename: this.wordListFilename,
      removeHistory: this.removeHistory,
      defaultVisible: this.defaultVisible
    }
  }

  loadWordList (text, filename) {
    const list = []
    for (const line of text.split('\n')) {
      let [word, definition] = line.split('\t')
      if (word && definition) {
        list.push({ word: word, definition: definition })
      }
    }

    this.setState({
      index: 0,
      wordList: list,
      wordListFilename: filename
    })
  }

  init () {
    let state
    try {
      state = JSON.parse(localStorage[SERVICE_NAME] || '{}')
    } catch (e) {
      state = {}
    }
    this.setState(state)
    this.initialized = true
  }

  save () {
    localStorage[SERVICE_NAME] = JSON.stringify(this.getState())
  }

  screenCaptureMode () {
    // Disable unnecessary feature to not disturb screen capture for movie by Selenium.
    this.defaultVisible = { word: true, definition: true, caption: true, image: true }
    Config = DefaultConfig
  }

  searchSystemDictionarySimple (word = (this.getCard() || {}).word) {
    if (!word) return
    // Works, but user need to manually re-focus to Chrome.
    this.giveUpProxy = true
    const a = document.getElementById('dict-search')
    a.href = 'dict://' + word
    a.click()
  }

  searchSystemDictionary (word = (this.getCard() || {}).word) {
    if (!word) return

    if (this.localProxyConnectionFailed) {
      this.searchSystemDictionarySimple(word)
      return
    }
    const url = `http://127.0.0.1:8000/${word}`
    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = event => {
      if (xhr.readyState === 4) {
        if (xhr.status !== 200) {
          this.localProxyConnectionFailed = true
          this.searchSystemDictionarySimple(word)
        }
      }
    }
    xhr.open('GET', url, true)
    xhr.send()
  }
}

// Main section
//= =============================================
const SERVICE_NAME = 't9md/cram-vocabulary'

let Config = {}
const DefaultConfig = {
  searchSystemDictionary: false,
  playAudio: false,
  playAudioFields: [1]
}

let Keymap = {}
let DefaultKeymap = {
  '0': 'first-card',
  ArrowUp: 'previous-card',
  ArrowDown: 'next-card',
  ArrowRight: 'next',
  ArrowLeft: 'previous',
  s: 'search-image-now',
  k: 'previous-card',
  j: 'next-card',
  i: 'toggle-image',
  n: 'next',
  '1': 'toggle-word',
  '2': 'toggle-definition',
  '-': 'delete-current-word',
  t: 'toggle-caption',
  u: 'undo-deletion',
  Enter: 'next',
  // Backspace: 'delete-current-word',
  '?': 'show-help',
  p: 'play-or-stop-audio',
  d: 'search-system-dictionary'
}

const Commands = {
  'first-card': () => app.setCard('top'),
  'next-card': () => app.setCard('next'),
  'previous-card': () => app.setCard('previous'),
  next: () => app.next(),
  previous: () => app.previous(),
  'toggle-image': () => app.toggleShow('image'),
  'toggle-word': () => app.toggleShow('word'),
  'toggle-definition': () => app.toggleShow('definition'),
  'toggle-caption': () => app.toggleShow('caption'),
  'delete-current-word': () => app.deleteCurrentWord(),
  'undo-deletion': () => app.undoDeletion(),
  'search-image-now': () => app.searchImageNow(),
  'search-system-dictionary': () => app.searchSystemDictionary(),
  'show-help': () => app.showHelp(),
  'scroll-to-top': () => window.scrollTo(0, 0),
  'scroll-to-word-list': () => document.getElementById('words-container').scrollIntoView(),
  'play-or-stop-audio': () => app.playOrStopAudio()
}

function initBodyClick () {
  const handleBodyClick = event => {
    const element = event.target
    if (element === document.body || document.getElementById('caption').contains(element)) {
      if (app.wordList) app.next()
    }
  }
  document.body.addEventListener('click', handleBodyClick, 'false')
}

function initKeyboad () {
  const handleKeydown = event => {
    // console.log(event.key)

    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState
    const modifiers = ['Fn', 'Hyper', 'OS', 'Super', 'Win', 'Control', 'Alt', 'Meta']
    if (modifiers.some(modifier => event.getModifierState(modifier))) {
      return false
    }

    if (event.key in Keymap) {
      event.preventDefault()
      event.stopPropagation()
      const command = Keymap[event.key]
      Commands[command](event)
    }
  }
  document.body.addEventListener('keydown', handleKeydown)
}

function initDropFile () {
  // copy&modified from https://stackoverflow.com/questions/8006715/drag-drop-files-into-standard-html-file-input
  const element = document.getElementById('filedrop')
  const cancelDefault = event => event.preventDefault()
  element.ondragover = cancelDefault
  element.ondragenter = cancelDefault
  element.ondrop = event => {
    fileinput.files = event.dataTransfer.files
    event.preventDefault()
  }
}

function initFileInput () {
  const handleFile = event => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = event => app.loadWordList(reader.result, file.name)
      reader.readAsText(file)
    }
  }
  document.getElementById('fileinput').addEventListener('change', handleFile, false)
}

function initDoubleClickOfTextArea () {
  const handleDoubleClick = event => {
    const element = event.target
    event.stopPropagation()
    const index = element.value.substr(0, element.selectionStart).split('\n').length - 1
    if (index > 0) {
      app.index = index
      app.setCard('refresh')
    }
  }
  styleForId('words-container').top = window.screen.height + 'px'
  document.getElementById('active-words').addEventListener('dblclick', handleDoubleClick)
}

function initHelp () {
  const container = document.getElementById('help')
  container.style.display = 'none'
  const items = []
  for (const key of Object.keys(Keymap)) {
    const keyAndAction = escapeHtml(key + ':  ' + Keymap[key])
    items.push(`<li><tt>${keyAndAction}</tt></li>`)
  }
  container.innerHTML = '<ul>' + items.join('\n') + '</ul>'
}

function initDownload () {
  function downloadWordList (event) {
    const element = event.target
    const kind = element.id.replace('download-', '')
    const content = element.parentElement.nextElementSibling.value
    const blob = new Blob([content], { type: 'text/plain' })
    element.download = kind + '-' + app.wordListFilename
    element.href = window.URL.createObjectURL(blob)
  }
  document.getElementById('download-active').addEventListener('click', downloadWordList)
  document.getElementById('download-removed').addEventListener('click', downloadWordList)
}

const app = new App()

window.onload = () => {
  Config = Object.assign({}, DefaultConfig, Config)
  Keymap = Object.assign({}, DefaultKeymap, Keymap)

  document.getElementById('reset-app').addEventListener('click', () => app.setState({}))
  app.init()
  initBodyClick()
  initKeyboad()
  initDropFile()
  initFileInput()
  initDoubleClickOfTextArea()
  initHelp()
  initDownload()
}

window.onbeforeunload = event => {
  app.save()
  event.returnValue = ''
}
