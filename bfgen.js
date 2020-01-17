'use strict';
// 外部モジュールインポート
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const svg2ttf = require('svg2ttf');
const mkdirp = require('mkdirp');
const program = require('commander');

// 標準の設定ファイル名
const configFileDefault = 'config.yaml';

// 設定ファイルが無いときの省略値（必ず設定する）
// horizAdvX ascent は '*' を指定可能で、値を算出する
const dataDefault = {
	'fontFileName': 'brailleFont',
	'fontName': null,
	'description': 'eight-dot braille fonts',
	'version': '1.0',
	'copyright': '© takayan',
	'url': 'https://github.com/rosmarinus/bfgen',
	'sixDot': false,
	'kana': false,
	'kantenji': true,
	'shiftKantenji': false,
	'blackMark': 'dot',
	'whiteMark': 'dash',
	'unitsPerEm': 2048,
	'horizAdvX': '*',
	'ascent': '*',
	'descent': -410,
	'weight': 'normal',
	'stretch': 'normal',
	'underlineThickness': 120,
	'underlinePosition': -240,
	'xs': 320,
	'ys': 1300,
	'dx': 490,
	'dy': 480,
	'radius': 170,
	'thickness': 30,
	'pinRadius': 50,
};
let data = {};
Object.assign(data, dataDefault);

// コマンドラインの処理
program
	.version('1.0.0')
	.option('-c, --config <configFile>', 'YAML-formated config file name', configFileDefault)
	.option('-f, --fontfile <fontFileName>', `font file basename (default: "${data['fontFileName']}")`)
	.parse(process.argv);

// 不明な引数があるときは終了する
if (program.args.length > 0) {
	if (program.args.length === 1) {
		console.error(program._name, ": unknown argument: ", program['args'][0]);
	} else {
		console.error(program._name, ": unknown arguments: ", program['args'].join(', '));
	}
	program.help();
}

// 設定ファイルを読み込む
const configFile = program['config'];
if (fs.existsSync(configFile)) {
	data = Object.assign(data, yaml.safeLoad(fs.readFileSync(configFile, 'utf8')));
}

// 要素が無ければ、省略値を入れる
Object.keys(dataDefault).forEach(
	item => {
		if (data[item] === null) data[item] = dataDefault[item]
	});

// 文字上端の値
if (data['ascent'] === '*') {
	data['ascent'] = data['unitsPerEm'] + data['descent'];
}

// ファイル名を取得する
const fileName = program['fontfile'] != undefined ?
	program['fontfile'] : data['fontFileName'];

// 八点点字を漢点字として扱うか
//（最上段を追加の点とする。ただしこれだけではユニコード点字の配置は変えない。）
// 六点点字のみのときは無意味
data['kantenji'] = data['sixDot'] ? false : data['kantenji'];

// 特殊な漢点字のために最下段を最上段にシフトして表示する
// 始点終点情報をユニコード点字の7点8点で保存した場合用
data['shiftKantenji'] = data['kantenji'] ? data['shiftKantenji'] : false;

// ユニコード点字範囲
const start = 0x2800;
const end = data['sixDot'] ? 0x283f : 0x28ff;

// フォントの幅
if (data['horizAdvX'] === '*') {
	data['horizAdvX'] = data['xs'] * 2 + data['radius'] * 2 + data['dx'];
}

// 名前の作成
const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);
const fontID = (data['sixDot'] ? 'Six-' : 'Eight-') +
	capitalize(data['blackMark']) +
	(data['whiteMark'] === 'empty' ? '' : `${capitalize(data['whiteMark'])}`) +
	(data['kantenji'] ? '-Kantenji' : '-Braille') +
	(data['shiftKantenji'] ? '-Shifted' : '');

if (data['fontName'] === null) {
	data['fontName'] = (data['sixDot'] ? 'six ' : 'eight ') +
		data['blackMark'] +
		(data['whiteMark'] === 'empty' ? ' ' : `-${data['whiteMark']} `) +
		(data['kantenji'] ? 'kantenji' : 'braille') +
		(data['shiftKantenji'] ? ' shifted' : '');
}

// 最下段、何もなければ空点の印を除外（六点点字のみを作る場合用）
const bottomWhiteExclude = data['sixDot'];

// 最上段、何もなければ空点の印を除外（八点点字の下の六点のみを使う場合用）
// 漢点字の場合、三マス漢点字のニマス目も除外されてしまうので要らない
const topWhiteExclude = false;

// 図形描画関数を設定する
const Shape = require('./lib/shapes/shapeloader');
const shape = new Shape(data);

// 指定された点字の図形を作成する
const movement = codeArray => {
	let result = '';
	let counter = 0;
	for (const code of codeArray) {
		for (const bit of [0, 1, 2, 3, 4, 5, 6, 7]) {
			const pos = !data['shiftKantenji'] ? {
				0: [0, 0],
				1: [0, 1],
				2: [0, 2],
				6: [0, 3],
				3: [1, 0],
				4: [1, 1],
				5: [1, 2],
				7: [1, 3]
			} : {
				0: [0, 1],
				1: [0, 2],
				2: [0, 3],
				6: [0, 0],
				3: [1, 1],
				4: [1, 2],
				5: [1, 3],
				7: [1, 0]
			};
			const [x, y] = pos[bit];
			if ((code - start) & (1 << bit)) {
				result += shape.blackMovement(x, y, counter);
			} else if ((!bottomWhiteExclude || ((code - start) >= 0x40) || (bit != 6 && bit != 7)) &&
				(!topWhiteExclude || ((code - start) & 0b1001 != 0) || (bit != 0 && bit != 3))) {
				result += shape.whiteMovement(x, y, counter);
			} else {
				result += '';
			}
		}
		counter++;
	}
	return result;
}

// グリフデータを作成する
const generateGryph = (number, code) => {
	if (number === null || number === '') {
		return '';
	}
	if (typeof (number) === "string" || number instanceof String) {
		number = number.charCodeAt(0);
	}
	const codeArray = isNaN(code) ? [...code].map(ch => ch.charCodeAt(0)) : [code];

	// グリフタグのテンプレートに展開
	return `\
      <glyph
        glyph-name="uni${ number.toString(16).padStart(4, '0').toUpperCase()}"
        unicode="&#x${ number.toString(16).padStart(4, '0')};"
        horiz-adv-x="${data['horizAdvX'] * codeArray.length}"
        d="${ movement(codeArray)}" />`;
}

// ユニコード点字のグリフを作成する
let glyphs = ''
for (let code = start; code <= end; code++) {
	glyphs += generateGryph(code, code) + '\n';
}

// 追加テーブルで指定された文字のグリフを作成する
const Characters = require('./lib/table');
const characters = new Characters(data);
Object.keys(characters.table).forEach(key =>
	glyphs += generateGryph(key, characters.table[key]) + "\n");

// SVG XML の作成
const xml = `\
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
  <metadata>
  </metadata>
  <defs>
    <font horiz-adv-x="${data['unitsPerEm']}" id="${fontID}" >
      <font-face
        font-family="${data['fontName']}"
        units-per-em="${data['unitsPerEm']}"
        unicode-range="U+0020-FFEE"
        font-weight="${data['weight']}"
        font-stretch="${data['stretch']}"
        ascent="${data['ascent']}"
        descent="${data['descent']}"
        underline-thickness="${data['underlineThickness']}"
        underline-position="${data['underlinePosition']}"
         />
      <missing-glyph />
      <glyph glyph-name="nonmarkingreturn"  />
${glyphs}
    </font>
  </defs>
</svg>`;

// ファイル出力
const options = {
	'copyright': data['copyright'],
	'description': data['description'],
	'url': data['url'],
	'version': data['version'],
};
const parent = path.dirname(fileName);
fs.stat(parent, (error, stats) => {
	// 必要ならば出力先フォルダ作成
	if (error && error.code === 'ENOENT') {
		mkdirp(parent, (error) => {
			if (error) {
				console.error('出力先フォルダを作成できません。');
				process.exit(-1);
			}
		})
	}
	console.error(`svg: ${fileName}.svg`);
	fs.writeFileSync(`${fileName}.svg`, xml, {
		encoding: 'utf8'
	});
	const ttf = svg2ttf(xml, options);
	console.error(`ttf: ${fileName}.ttf`);
	fs.writeFileSync(`${fileName}.ttf`, new Buffer.from(ttf.buffer));
});