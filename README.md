# cram-vocabulary

![](misc/cram-vocabulary.gif)

# これは何？

英単語を大量に覚えたい時、初期の詰め込み学習を助けるツール。  
具体的には、英単語の画像イメージを見ながら単語を詰め込めるアプリを提供する。  
Intensive な詰め込みを加速させることがを意図しており、Anki などの完全な暗記管理アプリの代わりにはならない。むしろ合わせて使うことを想定している。  

# おおまかな流れ

1. あなたは、覚えたい単語リストを持っている。(単語リスト: 英単語、意味がタブ文字で区切られたテキストファイル)
2. その単語リストを `bach-image-retrieve.py` に渡して、単語のイメージを画像検索し、スクリーンキャプチャを集める。
3. そして `slideshow/index.html` を開き、単語リストを開くと、画像を見ながら単語学習ができる！

## 環境

- Mac の Chrome ブラウザで使うことを想定している
- もしかしたら Windows でも動くかも知れないが確認していない。

## 前準備

- Chrome Browser を自動操縦するためのドライバ [Chrome driver](http://chromedriver.chromium.org/downloads) をダウンロードして、 PATH の通ったとこ(`/usr/local/bin` とか)に置く。
Shell から `chromedriver -h` と打って、help が出たらOK

- python selenium ライブラリ の install

```
pip install selenium
```

# チュートリアル

簡単なサンプルプロジェクトで自分でやってみよう。
使う単語リストは、`sample-words.txt` だ。
大まかには以下の２ステップだ。
時間は10分くらい？

1. 画像集め
2. 画像を見ながら単語学習

## 1.画像集め

`sample-words.txt` の中身は以下の様になっている。英単語と、意味が タブ(`\t`)で区切られたテキストファイルだ。  
これらの単語のイメージ画像をこれから集めて保存する。  

```
apple   りんご
orange  オレンジ
sad     悲しい
happy   楽しい
```

以下のコマンドを実行しよう

```shell
$ python bach-image-retrieve.py sample-words.txt
```

5秒ぐらい待とう。以下の様な結果がでるはず。
デフォルトで、Window サイズは 1280x720 でキャプチャし、`slideshow/imgs` ディレクトリに保存する。

```shell
$ python bach-image-retrieve.py sample-words.txt
window size {'width': 1280, 'height': 720}
output dir slideshow/imgs
sample-words.txt : start
  [SAVE] 001: slideshow/imgs/apple.png
  [SAVE] 002: slideshow/imgs/orange.png
  [SAVE] 003: slideshow/imgs/sad.png
  [SAVE] 004: slideshow/imgs/happy.png
$
```
画像集めはこれで DONE !!

## 2. 画像を見ながら単語学習

スライドショー app を開いてみよう

```
$ open slideshow/index.html
```

画面には `EMPTY!` と表示されているはずだ。まだ単語リストを設定していないからだ。  
画面を下にスクロールすると、`Drop file here` という文字が見えてくる。   
この領域に単語リストを `sample-words.txt` をドロップしよう。  

で、今度は上にスクロールしてもとに戻ろう。

最初の単語である `りんご` の画像が背景にでるはずだ。やった！ では、使っていこう！  
ちなみに、移行はブラウザを再起動しても、単語リストと現在のカードは復元される。  
別のファイルを使いたくなったら、今回のように下にスクロールて、別のファイルをドロップすればいい。  

- 基本的にキーボードで操作するアプリだ。
- `?`でヘルプがでる。もう一度押すと消せる。最初はヘルプ出しっぱなしにして、全てのキーを押して動作を理解してみよう。
![](misc/help.png)
- 重要なのは、`n`(`next`) だ。基本、学習中は `n` のみで次に進んでいくのが良い。単語の意味が出てなければでるし、すでに出てれば次の単語に進む。要するに`do what I mean` してくれる。
- 不要な単語は `-` で消せる。`u` で消したものを `undo` できる。
- スクロールダウンするとアクティブな単語リスト、消した単語リストを見られる。ダウンロードも出来る。
- アクティブな単語リストは、単語上でダブルクリックすると、その単語がカレントになる。特定の単語から始めたければ、このテキストをブラウザの検索機能で検索し、単語をダブルクリックすればいい。
- `1`(`toggle-word`), `2`(`toggle-definition`) のキーで、それぞれのフィールドを隠すか、出すか、調整できる。`2` で定義を隠せば、簡単な意味あてクイズになる。
- フルスクリーンで使用することを想定してつくったので、フルスクリーンで使って〜

このステップもDONE！ あとは自分の好きな単語リストでやってみよう。

## 3. 補足説明

### `bach-image-retrieve.py`

- `bach-image-retrieve.py` を動かすには `selenium` のインストールと、Chrome webdriver のインストールが必須。
- キャプチャする時の、Windowサイズと、保存先ディレクトリは変えられる。`-h` でヘルプが出る。単語リストファイルは、複数渡せる。

```
$ python bach-image-retrieve.py -h
Usage: bach-image-retrieve.py [options] word-list

Options:
  -h, --help            show this help message and exit
  -d DIR, --dir=DIR     Directory to write captured images.
  -w WINDOW, --window=WINDOW
                        Window
```

### slideshow app

- キーマップを変えられる？ → 変えられる。`slideshow/config.js` を直接編集して下さい。
- さらに　Chrome のブックマークバーに登録しておけば、ワンクリックでいつでも単語学習が開始できる！

- `slideshow/config.js` の `searchSytemDictionary:` ってなに？
  - Dictionary.app でも自動で単語検索してくれる機能。つかうには
  - `searchSytemDictionary: true` にする。
  - slideshow app 使っている時は、`python open-dict.py` で簡易プロキシ立ち上げ(上げっぱなしにしておく)
    - このプロキシは以下の事をやっている。
    - Chrome ブラウザから直接 `dict://{word}` を開けないので、`http` にしている
    - 検索後 Dictionary.app にフォーカスが取られるが、それを Chrome に戻す。

# CHANGES

- v4.0: ユーザーの単語リストを永続化させた。毎回ドロップする必要が無くなったので、`config.js` で `WORD_LIST` 経由で設定する方法を廃止。
- v3.1: `toggle-image`(デフォルトキーマップ `i`) で、イメージ画像の表示設定を切り替える。
- v3.0: `UserKeymap` と `DefaultKeymap` を分けた。`UserKeymap` は `DefaultKeymap`  に対する追加として扱われる
- v2.0: `search-image-now` コマンド追加。 `s` にキーマップ
- v1.1: スタイルをちょっと変更
- v1.0: 最初の公開
