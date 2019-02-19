function getValidIndex (list, index, allowWrap = false) {
  if (!allowWrap) {
    return Math.min(Math.max(index, 0), list.length - 1)
  }
  let validIndex = index % list.length
  if (validIndex < 0) validIndex = list.length + validIndex

  return validIndex
}

function replaceWithNewline (text, targetChar) {
  let nestLevel = 0
  return Array.from(text)
    .map(char => {
      if (char === '(') ++nestLevel
      else if (char === ')') --nestLevel

      return nestLevel === 0 && char === targetChar ? '\n' : char
    })
    .join('')
}

function unique (list) {
  return list.filter((value, index) => list.indexOf(value) === index)
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

function shuffleArray (array) {
  let currentIndex = array.length
  let temporaryValue, randomIndex

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
}

function removeItemFromList (list, item) {
  const index = list.indexOf(item)
  if (index >= 0) {
    return list.splice(index, 1)
  }
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
    this.cacheIsValid = true
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
    if (!this.allChoices) {
      // Use both active and removed wordlist as quiz choice for better variation.
      // Plus, item might be duplicated, so here we need to uniquify the list.
      const items = app.wordList.concat(app.getRemovedWordList())
      const allChoices = items.map(item => item[this.quizChoiceField])
      this.allChoices = unique(allChoices)
    }
    return this.allChoices.slice()
  }

  buildQuiz (cardIndex) {
    let choices = this.getAllChoices()

    // Pluck answer from all choices.
    const answer = app.getCard()[this.quizChoiceField]
    removeItemFromList(choices, answer)

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

  contentFor (text) {
    return this.filter ? this.filter(text) : text
  }

  renderElements (userAnsweredIndex = null) {
    const { choices, answerIndex } = this.currentQuiz

    const results = []
    for (let i = 0; i < choices.length; i++) {
      const choiceNo = i + 1
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
        html = `<li id="quiz-choice-${choiceNo}" class="${className}">${content}</li>`
      } else {
        html = `<li id="quiz-choice-${choiceNo}" >${content}</li>`
      }
      results.push(html)
    }
    const html = '<ol>' + results.join('\n') + '</ol>'
    document.getElementById(this.quizChoiceField).innerHTML = html
  }
}

const ImageSearchEngine = {
  google: 'https://www.google.com/search?gl=us&hl=en&pws=0&gws_rd=cr&tbm=isch&safe=active&q=%s',
  google_unsafe: 'https://www.google.com/search?gl=us&hl=en&pws=0&gws_rd=cr&tbm=isch&q=%s',
  bing: 'https://www.bing.com/images/search?safeSearch=Moderate&mkt=en-US&q=%s',
  bing_unsafe: 'https://www.bing.com/images/search?safeSearch=Off&mkt=en-US&q=%s'
}

class App {
  constructor () {
    // [BUG] Audio.play() result in exception when it is called with no user interaction after window.load
    // See https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
    this.initialized = false
    this.cardProceeded = false
    this.imageDirectoryIndex = 0
  }

  getCardIndexFor (where) {
    if (where === 'top') return 0

    let delta
    if (where === 'end') delta = Infinity
    else if (where === 'next') delta = 1
    else if (where === 'previous') delta = -1
    else if (where === 'refresh') delta = 0

    return getValidIndex(this.wordList, this.index + delta, Config.allowWrap)
  }

  getCard () {
    return this.wordList[this.index] || {}
  }

  shuffle () {
    this.mutateWordList(() => {
      this.wordList = shuffleArray(this.wordList)
    })
  }

  playOrStopAudio () {
    if (!this.audio) return

    if (this.audio.paused) this.audio.play()
    else this.audio.pause()
  }

  flashMessage (message) {
    const element = document.createElement('div')
    element.innerText = message
    document.body.appendChild(element)
    element.classList.add('flush-message')
    setTimeout(() => {
      element.remove()
    }, 1200)
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
    this.updateFieldVisibility({ caption: false, word: false, definition: false, image: false })

    if (!word) {
      document.getElementById('word').innerText = 'EMPTY!'
      document.getElementById('definition').innerHTML = '&#8595; Scroll down and drop your file.'
      this.updateFieldVisibility({ word: true, definition: true, caption: true, image: false })
    } else {
      document.getElementById('word').innerHTML = '<tt>' + word + '</tt>'
      document.getElementById('definition').innerText = replaceWithNewline(definition, ';').replace(/<br>/g, '\n')
      if (!this.quiz) {
        this.updateFieldVisibility(this.defaultVisible)
      } else {
        // quizChoiceField can be one of ['word', 'definition'].
        if (this.quizChoiceField === 'word') {
          this.updateFieldVisibility({ word: false, definition: true, caption: true, image: false })
        } else {
          this.updateFieldVisibility({ word: true, definition: false, caption: true, image: false })
        }
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
    const current = this.index + 1 || 0
    document.getElementById('progress-counter').innerText = `${current} / ${total}`
  }

  getNextImageUrl (allowWrap) {
    const word = this.getCard().word
    if (!word) return ''

    let index = this.getCurrentImageIndex()
    if (index != null) {
      index = getValidIndex(Config.imageDirectories, index + 1, allowWrap)
    } else {
      index = 0
    }
    return `url('${Config.imageDirectories[index]}/${word}.png')`
  }

  getCurrentImageIndex () {
    const current = document.body.style.backgroundImage
    if (!current) {
      return null
    }
    const regex = new RegExp(`url\\("(.*)/${this.getCard().word}.png"\\)`)
    const match = current.match(regex)
    const currentDir = match[1]
    return Config.imageDirectories.indexOf(currentDir)
  }

  updateFieldVisibility (state) {
    const wordWasVisible = this.isVisible('word')
    const definitionWasVisible = this.isVisible('definition')

    for (const field of Object.keys(state)) {
      const value = state[field]
      switch (field) {
        case 'image':
          document.body.style.backgroundImage = value ? this.getNextImageUrl(value === 'rotate') : ''
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

  rotateImage () {
    this.updateFieldVisibility({ image: 'rotate' })
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

    if (this.quiz) {
      if (canChange && (!this.isVisible('word') || !this.isVisible('definition'))) {
        this.updateFieldVisibility({ word: true, definition: true })
        return
      }
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

    if (!stayAtSameCard) {
      if (canChange && Config.hideCaptionOnEndOfNext && this.isVisible('caption')) {
        this.cardItemVisibilityManuallyChanged = true
        this.updateFieldVisibility({ caption: false })
        return
      }
      if (Config.rotateAllImageOnNext) {
        let index = this.getCurrentImageIndex()
        if (index < Config.imageDirectories.length - 1) {
          this.updateFieldVisibility({ image: true }) // Show next image available
          return
        }
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
      this.mutateWordList(() => {
        const removed = this.wordList.splice(this.index, 1)[0]
        this.removeHistory.push({ item: removed, index: this.index })
      })
    }
  }

  markCurrentWord () {
    if (this.wordList.length) {
      this.markdedWordList.push(this.getCard())
      this.flashMessage('Marked')
      this.renderMarkedWordlist()
    }
  }

  clearMarkedWordList () {
    this.markdedWordList = []
    this.renderMarkedWordlist()
  }

  getMarkedWordList () {
    return this.markdedWordList
  }

  refresh () {
    this.setCard('refresh')
    this.renderActiveWordList()
    this.renderRemovedWordList()
    this.renderMarkedWordlist()
  }

  mutateWordList (callback) {
    callback()
    this.refresh()
  }

  undoDeletion () {
    if (this.removeHistory.length) {
      const { item, index } = this.removeHistory.pop()
      this.index = index
      this.mutateWordList(() => {
        this.wordList.splice(index, 0, item)
      })
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
  renderMarkedWordlist () {
    this.renderWordList('marked-words', this.markdedWordList)
  }

  searchImage (engine) {
    if (!(engine in ImageSearchEngine)) return

    const card = this.getCard()
    if (card && card.word) {
      const a = document.getElementById('image-search')
      a.href = ImageSearchEngine[engine].replace('%s', card.word)
      a.click()
    }
  }

  getDefaultState () {
    return {
      index: -1,
      wordList: [],
      wordListFilename: '',
      markdedWordList: [],
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
    if (state.wordList && state.wordList !== this.getState().wordList) {
      Object.assign(state, {
        markdedWordList: [],
        removeHistory: []
      })
    }
    this.setState(Object.assign(this.getState(), state))
  }

  getState () {
    return {
      index: this.index,
      wordList: this.wordList,
      wordListFilename: this.wordListFilename,
      markdedWordList: this.markdedWordList,
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
    Config.hideCaptionOnEndOfNext = false
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
// ===========================================
const SERVICE_NAME = 't9md/cram-vocabulary'
let WORD_LIST = ''
let WORD_LIST_FILE_NAME = 'preloaded-word-list'

function initBodyClick () {
  const wordElement = document.getElementById('word')
  const definitionElement = document.getElementById('definition')
  const captionElement = document.getElementById('caption')
  const blankAreaOfCaptionElement = element => {
    return captionElement.contains(element) && (!wordElement.contains(element) && !definitionElement.contains(element))
  }

  const handleBodyClick = event => {
    const element = event.target
    if (element === document.body || blankAreaOfCaptionElement(element)) {
      if (app.wordList) app.next()
    }
  }
  document.body.addEventListener('click', handleBodyClick, false)
}

function onTapEndEvent (element, singleTapCallback, doubleTapCallback) {
  let moved = false
  let doubletap = false
  let timeoutID = null

  const handleTouchStart = event => {
    cancelEvent(event)
    if (timeoutID) {
      clearTimeout(timeoutID)
      doubletap = true
      timeoutID = null
    }
  }
  const handleTouchMove = event => {
    cancelEvent(event)
    moved = true
  }
  const handleTouchEnd = event => {
    cancelEvent(event)
    if (!moved) {
      if (doubletap) {
        doubletap = false
        doubleTapCallback(event)
      } else {
        timeoutID = setTimeout(function () {
          if (singleTapCallback) singleTapCallback(event)
          timeoutID = null
        }, 100)
      }
    }
    moved = false
  }
  element.addEventListener('touchstart', handleTouchStart, { passive: false })
  element.addEventListener('touchmove', handleTouchMove, { passive: false })
  element.addEventListener('touchend', handleTouchEnd, { passive: false })
}

function cancelEvent (event) {
  event.preventDefault()
  event.stopImmediatePropagation()
}

function onSimpleSingleTapEvent (element, callback) {
  let moved = false

  const handleTouchMove = event => {
    cancelEvent(event)
    moved = true
  }
  const handleTouchEnd = event => {
    cancelEvent(event)
    if (!moved) callback(event)
    moved = false
  }
  element.addEventListener('touchmove', handleTouchMove)
  element.addEventListener('touchend', handleTouchEnd)
}

function initTouchEvent () {
  const handleSingleTap = event => app.next()
  const handleDoubleTap = event => app.toggleQuizMode('definition')
  onTapEndEvent(document.getElementById('progress-counter'), handleSingleTap, handleDoubleTap)
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

function initFieldClick (element) {
  const wordElement = document.getElementById('word')
  const definitionElement = document.getElementById('definition')

  const handleAnswer = event => {
    event.preventDefault()
    event.stopImmediatePropagation()
    const match = event.target.id.match(/quiz-choice-(\d+)/)
    if (match) {
      app.answerQuiz(Number(match[1]))
    } else {
      const fieldNo = wordElement.contains(event.target) ? 1 : 2
      app.playAudio(fieldNo)
    }
  }

  wordElement.addEventListener('click', handleAnswer)
  definitionElement.addEventListener('click', handleAnswer)
  onSimpleSingleTapEvent(wordElement, handleAnswer)
  onSimpleSingleTapEvent(definitionElement, handleAnswer)
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
  document.getElementById('download-marked').addEventListener('click', downloadWordList)
}

function initClickClearMarkedWords () {
  const element = document.getElementById('clear-marked')
  element.addEventListener('click', () => app.clearMarkedWordList())
}

function initClickResetApp () {
  const element = document.getElementById('reset-app')
  element.addEventListener('click', () => app.setState({}))
}

const app = new App()

window.onload = () => {
  Config = Object.assign({}, DefaultConfig, Config)
  Keymap = Object.assign({}, DefaultKeymap, Keymap)

  app.init()
  initClickResetApp()
  initClickClearMarkedWords()
  initBodyClick()
  initTouchEvent()
  initFieldClick()
  initKeyboad()
  initDropFile()
  initFileInput()
  initDoubleClickOfTextArea()
  initHelp()
  initDownload()

  if (WORD_LIST) {
    app.loadWordList(WORD_LIST, WORD_LIST_FILE_NAME)
  }
}

window.onbeforeunload = event => {
  app.save()
  event.returnValue = ''
}
