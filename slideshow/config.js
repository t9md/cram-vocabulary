const Config = {
  searchSytemDictionary: false // macOS only
}

// En: The `key` must match with `event.key` of `keydown` event.
// You can check it in following link.
//   https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#Result
// Ja: 使える キー の名前は以下のリンクで確認可能です。
//   https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#Result
const Keymap = {
  '0': 'first-card',
  ArrowUp: 'previous-card',
  ArrowDown: 'next-card',
  ArrowRight: 'next',
  // ArrowLeft: 'delete-current-word',
  k: 'previous-card',
  j: 'next-card',
  n: 'next',
  '1': 'toggle-word',
  '2': 'toggle-definition',
  '-': 'delete-current-word',
  t: 'toggle-caption',
  u: 'undo-deletion',
  Enter: 'next',
  s: 'search-image-now',
  // Backspace: 'delete-current-word',
  '?': 'show-help'
}

// En: You can paste static word-list here to skip uploading word-list every time.
// Ja: 毎回ファイルをアップロードするのが面倒なら、以下をコメントアウトして書き換えればOK。
//     tab("\t") をスペースに変換しないように注意

// WORD_LIST = `
// apple	りんご
// orange	みかん
// `
