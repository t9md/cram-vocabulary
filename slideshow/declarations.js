// Config
//================================================
let Config = {}
const DefaultConfig = {
  searchSystemDictionary: false, // Auto open macOS system directory.
  playAudio: false,
  playAudioFields: [1], // For which nth fields play audio.
  quizChoiceCount: 4,   // Number of choices shown in quiz.
  quizChoiceTextFilter: {}, // [Advanced] Filter function to modify quiz choice text.
  quizAutoDeleteCorrectCard: false,
  allowWrap: false, // When wordlist reached end, it auto wrap to first word.
  imageDirectories: ['imgs'], // You can specify multiple image directory then `r` to rotate it.
  rotateAllImageOnNext: true, // When you proceed card phase by `n`, it auto rotate all bg image available.
  hideCaptionOnEndOfNext: true // When you execute `next` it hide caption to allow you to see bg image clearly.
}

// Commands
//================================================
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
  'search-image-by-google': () => app.searchImage('google'),
  'search-image-by-google-unsafe': () => app.searchImage('google_unsafe'),
  'search-image-by-bing': () => app.searchImage('bing'),
  'search-image-by-bing-unsafe': () => app.searchImage('bing_unsafe'),
  'search-system-dictionary': () => app.searchSystemDictionary(),
  'show-help': () => app.showHelp(),
  'scroll-to-top': () => window.scrollTo(0, 0),
  'scroll-to-word-list': () => document.getElementById('words-container').scrollIntoView(),
  'play-or-stop-audio': () => app.playOrStopAudio(),
  shuffle: () => app.shuffle(),
  'rotate-image': () => app.rotateImage()
}

// Keymap
//================================================
let Keymap = {}
let DefaultKeymap = {
  '0': 'first-card',
  ArrowUp: 'previous-card',
  ArrowDown: 'next-card',
  ArrowRight: 'next',
  ArrowLeft: 'previous',
  g: 'search-image-by-google',
  G: 'search-image-by-google-unsafe',
  b: 'search-image-by-bing',
  B: 'search-image-by-bing-unsafe',
  S: 'shuffle',
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
  // '5': 'answer-quiz-5',
  // '6': 'answer-quiz-6',
  '-': 'delete-current-word',
  u: 'undo-deletion',
  Enter: 'next',
  // Backspace: 'delete-current-word',
  '?': 'show-help',
  p: 'play-or-stop-audio',
  d: 'search-system-dictionary',
  q: 'quiz-definition',
  Q: 'quiz-word',
  i: 'rotate-image'
}
