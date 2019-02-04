let currentIndex = -1
let currentCard = {}
let wordList = []
let definitionVisible = false

const initialVisibilityState = {
  word: true,
  definition: false,
  caption: false,
}
let currentCardVisibilityState = {}

function setCardAtIndex(index) {
  currentCard = wordList[index]
  document.getElementById('word').innerText = currentCard.word
  document.getElementById('definition').innerText = currentCard.definition
  document.body.style.backgroundImage = `url('imgs/${currentCard.word}.png')`
  Object.assign(currentCardVisibilityState, initialVisibilityState)
  updateFieldVisibility(currentCardVisibilityState)
}

function setCard(where) {
  switch (where) {
    case 'next':
      currentIndex = ++currentIndex % wordList.length
      break
    case 'previous':
      --currentIndex
      if (currentIndex < 0) {
        currentIndex = wordList.length - 1
      }
      break
    case 'top':
      currentIndex = 0
      break
    case 'end':
      currentIndex = wordList.length - 1
      break
    default:
  }
  setCardAtIndex(currentIndex)
}

function captionIsVisible() {
  const element = document.getElementById('caption')
  return element.style.display !== 'none'
}

function toggleCaption() {
  initialVisibilityState.caption = !initialVisibilityState.caption
  updateFieldVisibility({caption: initialVisibilityState.caption})
}

function resetFieldVisiblity() {
  document.getElementById('definition').style.visibility = definitionVisible ? '' : 'hidden'
  document.getElementById('meaning').style.visibility = meaningVisible ? '' : 'hidden'
}

function updateFieldVisibility(state) {
  for (const field of Object.keys(state)) {
    const {style} = document.getElementById(field)
    const value = state[field]
    if (field === 'caption') {
      style.display = value ? 'none' : 'block'
    } else {
      style.visibility = value ? '' : 'hidden'
    }
  }
}

function toggleShowDefinition(field) {
  const value = initialVisibilityState[field]
  initialVisibilityState[field] = !value
  updateFieldVisibility(initialVisibilityState)
}

function next() {
  if (!captionIsVisible()) {
    document.getElementById('caption').style.display = 'block'
    return
  }
  const wordVisibility = document.getElementById('word').style.visibility
  const definitionVisibility = document.getElementById('definition').style.visibility
  if (wordVisibility === 'hidden' || definitionVisibility === 'hidden') {
    updateFieldVisibility({word: true, definition: true})
    return
  }
  setCard('next')
}

function init() {
  // const body = document.body
  // document.addEventListener('click', () => {
  //   next()
  // }, false)
  // body.addEventListener('click', () => {
  //   console.log("CLICKED!");
  // }, false)

  document.body.addEventListener(
    'click',
    () => {
      if (wordList.length) next()
    },
    false
  )
  document.body.addEventListener('keydown', event => {
    // playOrStopAudio
    console.log({
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
    })
    switch (event.key) {
      case ' ':
        event.preventDefault()
        event.stopPropagation()
        playOrStopAudio()
        break
      case '>':
        changeAudioSpeed('>')
        break
      case '<':
        changeAudioSpeed('<')
        break
      case '0':
        setCard('top')
        break
      case '1':
        toggleShowDefinition('word')
        break
      case '2':
        toggleShowDefinition('definition')
        break
      case 'ArrowDown':
      case 'j':
        setCard('next')
        break
      case 'ArrowUp':
      case 'k':
        setCard('previous')
        break
      case 'ArrowRight':
        next()
        break
      case 'ArrowLeft':
        break
      case 't':
        toggleCaption()
        break
      case 'n':
        next()
        break
      case 's':
        console.log(wordList)
        break
      default:
    }
  })

  // readLocalFile('files/anki-svl-12.txt', loadFileData)

  element = document.getElementById('setfile')
  element.addEventListener(
    'change',
    event => {
      const {files} = event.target
      const reader = new FileReader()
      reader.onload = event => loadFileData(reader.result)
      reader.readAsText(files[0])
      element.remove()
    },
    false
  )
}

// function readLocalFile(path, callback) {
//   const xhr = new XMLHttpRequest()
//   xhr.open('GET', path, true)
//   xhr.responseType = 'blob'
//   xhr.onload = function(e) {
//     if (this.status == 200) {
//       const fileReader = new FileReader()
//       fileReader.onload = d => callback(fileReader.result)
//       fileReader.readAsText(new File([this.response], 'temp'))
//     }
//   }
//   xhr.send()
// }

function loadFileData(data) {
  for (const line of data.split('\n')) {
    let [word, definition] = line.split('\t')
    if (definition) {
      wordList.push({
        word: word,
        definition: definition.replace(/<br>/g, '\n'),
      })
    }
    setCard('next')
  }
}

function playOrStopAudio(event) {
  const audio = document.getElementById('sound')
  if (audio.paused) {
    audio.play()
  } else {
    audio.pause()
  }
}

const audioSpeeds = [0.5, 0.8, 1.0, 1.1, 1.2, 1.3]

function changeAudioSpeed(which) {
  const audio = document.getElementById('sound')
  let index = audioSpeeds.indexOf(audio.playbackRate)
  if (which === ">") {
    index = Math.min(index + 1, audioSpeeds.length - 1)
  } else {
    index = Math.max(index - 1, 0)
  }
  audio.playbackRate = audioSpeeds[index]
  console.log('audio speed', audio.playbackRate);
}
