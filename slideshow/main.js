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
    case "next":
      currentIndex = ++currentIndex % wordList.length
      break;
    case "previous":
      --currentIndex
      if (currentIndex < 0) {
        currentIndex = wordList.length - 1
      }
      break;
    case "top":
      currentIndex = 0
      break;
    case "end":
      currentIndex = wordList.length - 1
      break;
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
  document.body.addEventListener('keydown', event => {
    console.log(event.code)
    switch (event.code) {
      case 'Digit0':
        setCard('top')
        break
      case 'Digit1':
        toggleShowDefinition('word')
        break
      case 'Digit2':
        toggleShowDefinition('definition')
        break
      case 'ArrowDown':
      case 'KeyJ':
        setCard('next')
        break
      case 'ArrowUp':
      case 'KeyK':
        setCard('previous')
        break
      case 'ArrowRight':
        next()
        break
      case 'ArrowLeft':
        break
      case 'KeyT':
        toggleCaption()
        break
      case 'KeyN':
      case 'Space':
        next()
        break
      case 'KeyS':
        console.log(wordList)
        break
      default:
    }
  })

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
