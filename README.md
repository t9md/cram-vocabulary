# cram-vocabulary

# これは何？

1. 覚えたい単語リストがある。
2. その単語リストを `bach-image-retrieve.py` に渡して、単語のイメージを画像検索し、スクリーンキャプチャを集める。
3. slideshow/index.html を開き、単語リストを開くと、集めたスクリーンキャプチャを使用して単語を詰め込めます！


# おおまかな流れ

1. `batch-image-retrieve.py` で、画像検索のスクリーンキャプチャを集める。
2. `slideshow/index.html` を開き、単語を詰め込み学習する。

HTML + JavaScript で出来た、簡単なスライドアプリ。集めた画像を、単語の背景画像として表示する。

# 画像集め

## 前準備

- [Chrome driver](http://chromedriver.chromium.org/downloads) をダウンロードして、 PATH の通ったとこ(`/usr/local/bin` とか)に置く。
Shell から `chromedriver -h` と打って、help が出たらOK

- selenium の install

```
pip install selenium
```

## 実行

```
py batch-image-retrieve.py wordlist.txt
```

- Chrome がヘッドレスで起動され(るので見えないが)、スクリーンキャプチャが始まる。
- 画像は `slideshow/imgs` 配下に保存される。  
- １単語毎に１秒スリープしてるので、割と時間はかかる。

# Slideshow app を開く前に

# 画像を使って詰め込み学習

## 前準備

特に無し

## 実行

`slideshow/index.html` を開く。Finder からダブルクリックでもよい。
```
open slideshow/index.html
```

- 操作は `?`で出るので、最初はヘルプ出しっぱなしにして、人と通り、キーを押してみて試してみると理解しやすいはず。全部は説明できないので要点のみ記載する。
- 不要な単語は `-` で消せる。`u` で消したものを `undo` できる。
- スクロールダウンするとアクティブな単語、消した単語を見られる。ダウンロードも出来る。
- アクティブな単語リストは、単語上でダブルクリックすると、その単語がカレントになる。特定の単語から始めたければ、このテキストをブラウザの検索機能で検索し、単語をダブルクリックすればいい。
- `1`(`toggle-word`), `2`(`toggle-definition`) のキーで、それぞれのフィールドを隠すか、出すか、調整できる。`2` で定義を隠せば、簡単な意味あてクイズになる。
- `n` キーは(`next`) で、基本、学習中は `n` のみで次に進んでいくのが良い。単語の意味が出てなければでるし、すでに出てれば次の単語に進む。要するに`do what I mean` してくれる。
- フルスクリーンで使用することを想定してつくったので、フルスクリーンで使って〜
