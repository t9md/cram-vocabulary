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

function humanizeKeyName (name) {
  return name.replace(/Arrow(Up|Down|Right|Left)$/, '$1').toLowerCase()
}

class App {
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

  setCard (where) {
    this.index = this.getCardIndexFor(where)
    const { word = '', definition = '' } = this.getCard()

    if (!word) {
      document.getElementById('word').innerText = 'EMPTY!'
      document.getElementById('definition').innerHTML = '&#8595; Scroll down and drop your file.'
      this.updateFieldVisibility({ word: true, definition: true, caption: true, image: false })
    } else {
      document.getElementById('word').innerText = word
      document.getElementById('definition').innerText = definition.replace(/<br>/g, '\n')
      this.updateFieldVisibility(this.defaultVisible)
    }

    if (word && Config.searchSytemDictionary) {
      const url = `http://127.0.0.1:8000/${word}`
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.send()
    }
  }

  getImageUrl () {
    const word = this.getCard().word
    return word ? `url('imgs/${this.getCard().word}.png')` : ''
  }

  updateFieldVisibility (state) {
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
  }

  toggleShow (field) {
    const newValue = !this.defaultVisible[field]
    this.defaultVisible[field] = newValue
    const obj = {}
    obj[field] = newValue
    this.updateFieldVisibility(obj)
  }

  next () {
    const captionStyle = styleForId('caption')
    if (captionStyle.display === 'none') {
      captionStyle.display = 'block'
      return
    }
    if (!document.body.style.backgroundImage) {
      this.updateFieldVisibility({ image: true })
      return
    }
    if (styleForId('word').visibility === 'hidden' || styleForId('definition').visibility === 'hidden') {
      this.updateFieldVisibility({ word: true, definition: true })
      return
    }
    if (this.index < this.wordList.length - 1) {
      this.setCard('next')
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
    const word = this.getCard()
    if (word && word.word) {
      const a = document.getElementById('image-search')
      a.href = 'https://www.google.com/search?gl=us&hl=en&pws=0&gws_rd=cr&tbm=isch&q=' + word.word
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
  }

  save () {
    localStorage[SERVICE_NAME] = JSON.stringify(this.getState())
  }
}

// Main section
//= =============================================
const SERVICE_NAME = 't9md/cram-vocabulary'

let Config = {}
const DefaultConfig = { searchSytemDictionary: false }

let Keymap = {}
let DefaultKeymap = {
  '0': 'first-card',
  ArrowUp: 'previous-card',
  ArrowDown: 'next-card',
  ArrowRight: 'next',
  ArrowLeft: 'delete-current-word',
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
  '?': 'show-help'
}

const Commands = {
  'first-card': () => app.setCard('top'),
  'next-card': () => app.setCard('next'),
  'previous-card': () => app.setCard('previous'),
  next: () => app.next(),
  'toggle-image': () => app.toggleShow('image'),
  'toggle-word': () => app.toggleShow('word'),
  'toggle-definition': () => app.toggleShow('definition'),
  'toggle-caption': () => app.toggleShow('caption'),
  'delete-current-word': () => app.deleteCurrentWord(),
  'undo-deletion': () => app.undoDeletion(),
  'search-image-now': () => app.searchImageNow(),
  'show-help': () => app.showHelp(),
  'scroll-to-top': () => window.scrollTo(0, 0),
  'scroll-to-word-list': () => document.getElementById('words-container').scrollIntoView()
}

function initBodyClick () {
  const handleBodyClick = event => {
    if (event.target !== document.body) return
    if (app.wordList) app.next()
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
    const keyAndAction = escapeHtml(humanizeKeyName(key) + ':  ' + Keymap[key])
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
  Config = Object.assign(Config, DefaultConfig)
  Keymap = Object.assign(Keymap, DefaultKeymap)

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
