let WORD_LIST = ''
_WORD_LIST = `
accede	【自】（地位・職に）就く、継承する、加盟する、同意する、応じる<br>
artifice	【名】巧みな策略、術策、ぺてん<br>
abate	【他】…を和らげる、…を減ずる、…を無効にする、…を却下する<br>【自】和らぐ、収まる<br>
bile	【名】かんしゃく、不機嫌、胆汁<br>
sultan	【名】サルタン（イスラム教国の君主）、暴君
abdicate	【自】退位する、辞任する<br>【他】（王位）を退く、…を放棄する<br>
lesion	【名】損傷、（機能）障害、病巣<br>
duchy	【名】公爵領、公国、（英国の）王族公領<br>
arbitration	【名】仲裁、調停<br>
allay	【他】…を和らげる、…を静める、（疑惑）を解消する<br>
hemorrhage	【名】（資金・頭脳などの）国外流出、大出血、損失<br>
amalgamate	【自】合併する、融合する<br>【他】（会社など）を合併する、…を融合する<br>
confederation	【名】同盟、連合（国）、連邦<br>
incursion	【名】（突然の）侵入、襲撃、流入<br>
beget	【他】（好ましくないもの）を生み出す、…の原因となる、…の父親になる<br>
iniquity	【名】不法（行為）、悪行、非道<br>
decorum	【名】礼儀正しさ、上品さ、（decorums で）礼儀作法、礼節<br>
belie	【他】…と矛盾する、…が偽りであることを示す、（期待など）を裏切る<br>
quay	【名】埠頭、岸壁、波止場<br>
billow	【自】（帆・旗などが）膨らむ、はためく、（炎・煙などが）渦巻く、うねる<br>【名】（炎や煙の）うねり、大波
capricious	【形】気まぐれな、移り気な、不規則な、不安定な<br>
bode	【他】…の前兆となる、…を予兆する<br>
auspicious	【形】幸先のよい、めでたい、吉兆の<br>
subversion	【名】（政府の）転覆、破壊<br>
cleave	【他】…を切り裂く、（道など）を切り開く、…を分裂させる、…を裂く<br>【自】①割れる、裂ける　②執着する、くっつく<br>
iris	【名】（眼球の）虹彩、アイリス（アヤメ科の植物）<br>
`

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
    if (where === 'top') return 0

    let delta
    if (where === 'end') delta = Infinity
    else if (where === 'next') delta = 1
    else if (where === 'previous') delta = -1
    else if (where === 'refresh') delta = 0

    return getValidIndex(this.index + delta, this.wordList)
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

    if (Config.searchSytemDictionary) {
      const url = `http://127.0.0.1:8000/${word}`
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.send()
    }
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
      this.refreshAfterWordListMutation()
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

const app = new App()
function init () {
  const handleBodyClick = event => {
    if (event.target !== document.body) return
    if (app.wordList) app.next()
  }
  document.body.addEventListener('click', handleBodyClick, 'false')

  const handleKeydown = event => {
    // console.log(event.key);
    if (event.key in Keymap) {
      event.preventDefault()
      event.stopPropagation()
      const command = Keymap[event.key]
      Commands[command](event)
    }
  }
  document.body.addEventListener('keydown', handleKeydown)

  styleForId('caption').display = 'none'
  const loadWordList = (text, filename) => {
    const list = []
    for (const line of text.split('\n')) {
      let [word, definition] = line.split('\t')
      if (word && definition) {
        list.push({ word: word, definition: definition })
      }
    }

    document.getElementById('file-area').remove()
    app.setWordList(list, filename)
    app.setCard('next')
  }

  // Handle drop file
  {
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

  {
    const handleFile = event => {
      const element = event.target
      const file = element.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = event => loadWordList(reader.result, file.name)
        reader.readAsText(file)
      }
    }
    document.getElementById('fileinput').addEventListener('change', handleFile, false)
  }

  if (WORD_LIST) {
    loadWordList(WORD_LIST, 'static-words')
  }

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
    styleForId('words-container').top = window.screen.height + 'px'
    document.getElementById('active-words').addEventListener('dblclick', handleDoubleClick)
  }
  {
    const container = document.getElementById('help')
    container.style.display = 'none'
    const items = []
    for (const key of Object.keys(Keymap)) {
      const keyAndAction = escapeHtml(humanizeKeyName(key) + ':  ' + Keymap[key])
      items.push(`<li><tt>${keyAndAction}</tt></li>`)
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

function humanizeKeyName (name) {
  return name.replace(/Arrow(Up|Down|Right|Left)$/, '$1').toLowerCase()
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
