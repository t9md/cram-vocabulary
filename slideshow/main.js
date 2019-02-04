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
    this.index = -1
    this.wordList = null
    this.defaultVisible = {
      word: true,
      definition: false,
      caption: false
    }
    this.currentVisible = {}
    this.removeHistory = []
  }

  setWordList (wordList, filename) {
    this.wordList = wordList
    this.wordListFilename = filename
    this.renderActiveWordList()
  }

  getCardIndexFor (where) {
    switch (where) {
      case 'next':
        return getValidIndex(this.index + 1, this.wordList)
      case 'previous':
        return getValidIndex(this.index - 1, this.wordList)
      case 'refresh':
        return getValidIndex(this.index, this.wordList)
      case 'top':
        return 0
      case 'end':
        return getValidIndex(Infinity, this.wordList)
    }
  }

  setCard (where) {
    if (!this.wordList.length) return
    this.index = this.getCardIndexFor(where)

    const { word, definition = '' } = this.wordList[this.index]
    document.getElementById('word').innerText = word
    document.getElementById('definition').innerText = definition.replace(/<br>/g, '\n')
    document.body.style.backgroundImage = `url('imgs/${word}.png')`

    Object.assign(this.currentVisible, this.defaultVisible)
    this.updateFieldVisibility(this.currentVisible)
  }

  toggleCaption () {
    this.defaultVisible.caption = !this.defaultVisible.caption
    this.updateFieldVisibility({ caption: this.defaultVisible.caption })
  }

  updateFieldVisibility (state) {
    for (const field of Object.keys(state)) {
      const style = styleForId(field)
      const value = state[field]
      if (field === 'caption') {
        style.display = value ? 'none' : 'block'
      } else {
        style.visibility = value ? '' : 'hidden'
      }
    }
  }

  toggleShowField (field) {
    this.defaultVisible[field] = !this.defaultVisible[field]
    this.updateFieldVisibility(this.defaultVisible)
  }

  next () {
    const captionStyle = styleForId('caption')
    if (captionStyle.display === 'none') {
      captionStyle.display = 'block'
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
      const operation = { item: removed, index: this.index }
      this.removeHistory.push(operation)
      this.refreshAfterWordListMutation()
    }
  }

  refreshAfterWordListMutation () {
    this.setCard('refresh')
    this.renderActiveWordList()
    this.renderRemovedWordList()
  }

  undoDeletion () {
    if (this.removeHistory.length) {
      const { item, index } = this.removeHistory.pop()
      this.wordList.splice(index, 0, item)
      this.index = index
      console.log(this.wordList)
      this.refreshAfterWordListMutation()
    }
  }

  showHelp () {
    console.log('HELOP!')
    const container = document.getElementById('help')
    console.log(container.style.display)
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
    this.renderWordList('active-word-list', this.wordList)
  }
  renderRemovedWordList () {
    this.renderWordList('removed-word-list', this.getRemovedWordList())
  }
}

const Commands = {
  'play-or-stop-audio': () => playOrStopAudio(),
  'audio-forward-5s': () => setAudioTimeWithDelta(+5),
  'audio-rewind-5s': () => setAudioTimeWithDelta(-5),
  'audio-rate-up': () => changeAudioSpeed('>'),
  'audio-rate-down': () => changeAudioSpeed('<'),
  'first-card': () => app.setCard('top'),
  'toggle-word': () => app.toggleShowField('word'),
  'toggle-definition': () => app.toggleShowField('definition'),
  'next-card': () => app.setCard('next'),
  'previous-card': () => app.setCard('previous'),
  next: () => app.next(),
  'toggle-caption': () => app.toggleCaption(),
  'delete-current-word': () => app.deleteCurrentWord(),
  'undo-deletion': () => app.undoDeletion(),
  'show-help': () => app.showHelp()
}

const Keymap = {
  '0': 'first-card',
  ArrowUp: 'previous-card',
  ArrowDown: 'next-card',
  ArrowRight: 'next',
  k: 'previous-card',
  j: 'next-card',
  n: 'next',
  '1': 'toggle-word',
  '2': 'toggle-definition',
  '-': 'delete-current-word',
  t: 'toggle-caption',
  u: 'undo-deletion',
  '?': 'show-help'
  // p: 'play-or-stop-audio',
  // b: 'audio-rewind-5s',
  // f: 'audio-forward-5s',
  // d: 'download-word-list',
  // '>': 'audio-rate-up',
  // '<': 'audio-rate-down',
}

const app = new App()
function init () {
  const handleBodyClick = event => {
    if (event.target !== document.body) return
    if (app.wordList) app.next()
  }
  document.body.addEventListener('click', handleBodyClick, 'false')

  const handleKeydown = event => {
    if (event.key in Keymap) {
      event.preventDefault()
      event.stopPropagation()
      const command = Keymap[event.key]
      Commands[command](event)
    }
  }
  document.body.addEventListener('keydown', handleKeydown)

  const handleFile = event => {
    const element = event.target
    const file = element.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = event => {
        const list = []
        for (const line of reader.result.split('\n')) {
          let [word, definition] = line.split('\t')
          if (word && definition) {
            list.push({ word: word, definition: definition })
          }
        }
        app.setWordList(list, file.name)
        app.setCard('next')
      }
      reader.readAsText(file)
      element.remove() // disappear!
    }
  }
  document.getElementById('setfile').addEventListener('change', handleFile, false)

  {
    const handleDoubleClick = event => {
      const element = event.target
      event.stopPropagation()
      const index = element.value.substr(0, element.selectionStart).split('\n').length - 1
      if (index > 0) {
        app.index = index
        app.setCard('refresh')
      }
    }
    const container = document.getElementById('active-words-container')
    container.style.marginTop = window.screen.height + 'px'
    container.addEventListener('dblclick', handleDoubleClick)
  }
  {
    const container = document.getElementById('help')
    container.style.display = 'none'
    const items = []
    for (const key of Object.keys(Keymap)) {
      const displayKey = key.replace(/Arrow(Up|Down|Right|Left)$/, '$1').toLowerCase()
      items.push('<li>' + escapeHtml(displayKey + ':  ' + Keymap[key]) + '</li>')
    }
    container.innerHTML = '<ul>' + items.join('\n') + '</ul>'
  }
  {
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
}

function playOrStopAudio (event) {
  const audio = document.getElementById('sound')
  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}

const audioSpeeds = [0.5, 0.8, 1.0, 1.1, 1.2, 1.3]

function setAudioTimeWithDelta (delta) {
  const audio = document.getElementById('sound')
  audio.currentTime = audio.currentTime + delta
}

function changeAudioSpeed (which) {
  const audio = document.getElementById('sound')
  let index = audioSpeeds.indexOf(audio.playbackRate)
  if (which === '>') {
    index = getValidIndex(index + 1, audioSpeeds)
  } else {
    index = getValidIndex(index - 1, audioSpeeds)
  }
  audio.playbackRate = audioSpeeds[index]
}
