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

function getRandom (array, count) {
  const result = new Array(count)
  let availableCounts = array.length
  const taken = new Array(availableCounts)
  if (count > availableCounts) throw new RangeError('getRandom: more elements taken than available')
  while (count--) {
    const x = Math.floor(Math.random() * availableCounts)
    result[count] = array[x in taken ? taken[x] : x]
    taken[x] = --availableCounts in taken ? taken[availableCounts] : availableCounts
  }
  return result
}

class Quiz {
  constructor (app, quizChoiceField) {
    this.choiceCount = Config.quizChoiceCount
    this.app = app
    this.quizChoiceField = quizChoiceField
    this.allChoices = null
    this.answered = false
    this.lastWordListLength = -1
    document.getElementById(quizChoiceField).classList.add('quiz')

    this.filter = Config.quizChoiceTextFilter[this.quizChoiceField]
    if (typeof this.filter !== 'function') {
      this.filter = null
    }
  }

  destroy () {
    document.getElementById('word').classList.remove('quiz')
    document.getElementById('definition').classList.remove('quiz')
  }

  getAllChoices () {
    // Auto invalidate cached result when word was deleted or deletion-undo-ed.
    if (this.lastWordListLength !== app.wordList.length) {
      this.lastWordListLength = app.wordList.length
      this.allChoices = null
    }

    if (!this.allChoices) {
      // Use both active and removed wordlist as quiz choice for better variation.
      const words = app.wordList.concat(app.getRemovedWordList())
      this.allChoices = words.map(item => item[this.quizChoiceField])
    }
    return this.allChoices.slice()
  }

  buildQuiz (cardIndex) {
    let choices = this.getAllChoices()

    // pluck answer from all choices.
    const answer = choices.splice(cardIndex, 1)[0]

    // Pick 3 randomized choices.
    choices = getRandom(choices, this.choiceCount - 1)

    // Insert answer in random position, now 4 choices in total.
    const answerIndex = Math.floor(Math.random() * this.choiceCount)
    choices.splice(answerIndex, 0, answer)

    return { choices: choices, answerIndex: answerIndex }
  }

  showQuestion (cardIndex) {
    this.answered = false
    this.currentQuiz = this.buildQuiz(cardIndex)
    this.renderElements()
  }

  showAnswer (userChoice) {
    this.answered = true
    const userAnsweredIndex = userChoice - 1
    this.answerWasCorrect = userAnsweredIndex === this.currentQuiz.answerIndex
    this.renderElements(userAnsweredIndex)
  }

  contentFor(text) {
    return this.filter ? this.filter(text) : text
  }

  renderElements (userAnsweredIndex = null) {
    const { choices, answerIndex } = this.currentQuiz

    const results = []
    for (let i = 0; i < choices.length; i++) {
      let html = ''
      let className = ''
      let content = this.contentFor(choices[i])
      if (userAnsweredIndex != null) {
        if (i === answerIndex) {
          content = choices[i] // Show original content especially for answer.
          className = 'correct'
        } else if (i === userAnsweredIndex) {
          className = 'incorrect'
        }
      }
      if (className) {
        html = `<li class="${className}">${content}</li>`
      } else {
        html = `<li>${content}</li>`
      }
      results.push(html)
    }
    const html = '<ol>' + results.join('\n') + '</ol>'
    document.getElementById(this.quizChoiceField).innerHTML = html
  }
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
      document.getElementById('word').innerHTML = '<tt>' + word + '</tt>'
      document.getElementById('definition').innerText = definition.replace(/<br>/g, '\n')
      this.updateFieldVisibility(this.defaultVisible)

      if (this.quiz) {
        this.quiz.showQuestion(this.index)
      }
    }

    if (word && Config.searchSystemDictionary) {
      this.searchSystemDictionary(word)
    }

    this.cardProceeded = false
    this.cardItemVisibilityManuallyChanged = false
    this.renderProgress()
  }

  answerQuiz (choice) {
    if (!this.quiz) return
    this.quiz.showAnswer(choice)
    if (Config.playAudio) {
      this.playAudio(this.quizChoiceField === 'word' ? 1 : 2)
    }
    this.next(true)
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
      const canPlayWord = this.quizChoiceField !== 'word'
      const canPlayDefinition = this.quizChoiceField !== 'definition'
      if (canPlayWord && !wordWasVisible && this.isVisible('word')) {
        audioFields.push(1)
      }
      if (canPlayDefinition && !definitionWasVisible && this.isVisible('definition')) {
        audioFields.push(2)
      }

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

  toggleShowOnce (id) {
    const obj = {}
    obj[id] = !this.isVisible(id)
    this.updateFieldVisibility(obj)
    this.cardItemVisibilityManuallyChanged = true
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

  next (stayAtSameCard = false) {
    this.cardProceeded = true

    const canChange = !this.cardItemVisibilityManuallyChanged
    if (canChange && !this.isVisible('caption')) {
      this.updateFieldVisibility({ caption: true })
      return
    }
    if (canChange && !document.body.style.backgroundImage) {
      this.updateFieldVisibility({ image: true })
      return
    }
    if (canChange && (!this.isVisible('word') || !this.isVisible('definition'))) {
      this.updateFieldVisibility({ word: true, definition: true })
      return
    }
    if (this.quiz && !this.quiz.answered) {
      this.answerQuiz(-1)
      return
    }

    if (!stayAtSameCard && this.index < this.wordList.length - 1) {
      if (canChange && this.quiz && this.isVisible('caption')) {
        this.cardItemVisibilityManuallyChanged = true
        this.updateFieldVisibility({ caption: false })
        return
      }
      if (this.quiz && Config.quizAutoDeleteCorrectCard && this.quiz.answerWasCorrect) {
        this.deleteCurrentWord()
      } else {
        this.setCard('next')
      }
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
      const googelImage = 'https://www.google.com/search?gl=us&hl=en&pws=0&gws_rd=cr&tbm=isch&safe=active&q='
      a.href = googelImage + card.word
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
      },
      quizChoiceField: null
    }
  }

  setState (state = {}) {
    Object.assign(this, this.getDefaultState(), state)

    if (this.quiz) {
      this.quiz.destroy()
      this.quiz = null
    }
    if (this.quizChoiceField) {
      this.quiz = new Quiz(this, this.quizChoiceField)
    }
    this.refresh()
  }

  updateState (state = {}) {
    this.setState(Object.assign(this.getState(), state))
  }

  getState () {
    return {
      index: this.index,
      wordList: this.wordList,
      wordListFilename: this.wordListFilename,
      removeHistory: this.removeHistory,
      defaultVisible: this.defaultVisible,
      quizChoiceField: this.quizChoiceField
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

    this.updateState({
      index: 0,
      wordList: list,
      wordListFilename: filename,
      removeHistory: []
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

  toggleQuizMode (quizChoiceField) {
    if (this.quizChoiceField && quizChoiceField === this.quizChoiceField) {
      quizChoiceField = null
    }
    this.updateState({ quizChoiceField: quizChoiceField })
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
//===============================================
const SERVICE_NAME = 't9md/cram-vocabulary'

let Config = {}
const DefaultConfig = {
  searchSystemDictionary: false,
  playAudio: false,
  playAudioFields: [1],
  quizChoiceCount: 4,
  quizChoiceTextFilter: {},
  quizAutoDeleteCorrectCard: false
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
  n: 'next',
  'Control-1': 'toggle-word',
  'Control-2': 'toggle-definition',
  'Control-t': 'toggle-caption',
  'Control-i': 'toggle-image',
  '1': 'answer-quiz-1',
  '2': 'answer-quiz-2',
  '3': 'answer-quiz-3',
  '4': 'answer-quiz-4',
  '5': 'answer-quiz-5',
  '6': 'answer-quiz-6',
  '-': 'delete-current-word',
  u: 'undo-deletion',
  Enter: 'next',
  // Backspace: 'delete-current-word',
  '?': 'show-help',
  p: 'play-or-stop-audio',
  d: 'search-system-dictionary',
  q: 'quiz-definition',
  Q: 'quiz-word'
}

const Commands = {
  'answer-quiz-1': () => app.answerQuiz(1),
  'answer-quiz-2': () => app.answerQuiz(2),
  'answer-quiz-3': () => app.answerQuiz(3),
  'answer-quiz-4': () => app.answerQuiz(4),
  'quiz-word': () => app.toggleQuizMode('word'),
  'quiz-definition': () => app.toggleQuizMode('definition'),
  'first-card': () => app.setCard('top'),
  'next-card': () => app.setCard('next'),
  'previous-card': () => app.setCard('previous'),
  next: () => app.next(),
  previous: () => app.previous(),
  'toggle-image': () => app.toggleShow('image'),
  'toggle-word': () => app.toggleShow('word'),
  'toggle-definition': () => app.toggleShow('definition'),
  'toggle-caption-once': () => app.toggleShowOnce('caption'),
  'toggle-image-once': () => app.toggleShowOnce('image'),
  'toggle-word-once': () => app.toggleShowOnce('word'),
  'toggle-definition-once': () => app.toggleShowOnce('definition'),
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
    const modifierState = {}
    for (const modifier of modifiers) {
      modifierState[modifier] = event.getModifierState(modifier)
    }

    const modifierPrefix = Object.keys(modifierState)
      .filter(k => modifierState[k])
      .join('-')
    let keySignature = (modifierPrefix ? modifierPrefix + '-' : '') + event.key

    if (keySignature === keySignature + '-' + keySignature) {
      // To skip when modifier is solely pressed, it result in such as 'Control-Controle', 'Meta-Meta'.
      return
    }

    if (keySignature in Keymap) {
      event.preventDefault()
      event.stopPropagation()
      const command = Keymap[keySignature]
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

function buildQuizElements ({ answerIndex, choices }, userAnsweredIndex = null) {
  const results = []
  for (let i = 0; i < choices.length; i++) {
    let html = ''
    let className = ''
    const content = choices[i]
    if (userAnsweredIndex != null) {
      if (i === answerIndex) {
        className = 'correct'
      } else if (i === userAnsweredIndex) {
        className = 'incorrect'
      }
    }
    if (className) {
      html = `<li class="${className}">${content}</li>`
    } else {
      html = `<li>${content}</li>`
    }
    results.push(html)
  }
  return '<ol>' + results.join('\n') + '</ol>'
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
