// Configuration
// ===================
// See following file for full list of available Config, Keymap, Command and also to get idea of how to configure it.
//
//  https://github.com/t9md/cram-vocabulary/blob/master/slideshow/declarations.js
//
// Config.searchSystemDictionary = false // macOS only
// Config.playAudio = true  // play `sounds/${word}-${fieldNo}.wav`
// Config.playAudioFields = [1, 2] // Set fields you want to play.
// Config.quizChoiceCount = 3 // Controll number of choices for quiz. Default 4
// Config.quizAutoDeleteCorrectCard = true // When true automatically delete correct card on you proceed by `next` command.
// Config.quizChoiceTextFilter = { // Advanced: If you want to modify text to display in quiz.
//   definition: (content) => { // You can set filter for `definition` and  `word`.
//     // Here pick, very 1st line and first field.
//     // e.g. Pick "退位する" in when original content was "退位する、辞任する<br>【他】（王位）を退く、…を放棄する<br>"
//     return content.split("<br>")[0].split("、")[0]
//   }
// }

// Keymap
// ===================
// En: The `key` must match with `event.key` of `keydown` event.
// En: You can check it in following link.
// En: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#Result
// Ja: 使える キー の名前は以下のリンクで確認可能です。
// Ja: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#Result
//
// Keymap = {
//   ArrowLeft: 'delete-current-word',
//   Backspace: 'delete-current-word',
//   g: 'scroll-to-top',
//   G: 'scroll-to-word-list'
// }

// En: To disable default keymap completely, enable following line.
// Ja: デフォルトキーマップを全て無効にしたければ以下のコメントを外す
// DefaultKeymap = {}

// En: You can delete specific only like this.
// Ja: 個別にキーを消すことも可能。
// delete DefaultKeymap['k']
