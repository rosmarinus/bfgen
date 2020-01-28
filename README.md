# bfgen
====
8-dot braille fonts generator

概要

これはユニコード点字フォントのSVGファイルとTTFファイルを出力するものです。
yamlフォーマットで書かれたデータを元にsvgファイルを作成し、[svg2ttf](https://www.npmjs.com/package/svg2ttf)を利用して、TTF（TruType）ファイルを作成します。
node.jsを使っていますが、単なるコンソールアプリケーションとして動作します。

## 使い方

bfgen -h で次のヘルプが出力されます。

```sh
Usage: bfgen [options]
Options:
  -V, --version                  output the version number
  -c, --config <configFile>      YAML-formated configuration file name (default: "config.yaml")
  -f, --fontfile <fontFileName>  font file basename (default: "brailleFont")
  -l, --list                     list configuration files in <config> directory
  -s, --shapes                   list available shapes
  -h, --help                     output usage information```


## インストール

```js
yarn global add https://github.com/rosmarinus/bfgen```
または、
```js
npm install -g https://github.com/rosmarinus/bfgen```



## ライセンス

このプログラムとプリセットの設定ファイル、そしてそれらによって作られたフォントファイルは、MITライセンスで公開します。

MITライセンス

