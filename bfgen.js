'use strict'
const fs = require('fs');
const yaml = require('js-yaml');
const svg2ttf = require('svg2ttf');
const program = require('commander');

// 標準の設定ファイル名
const configFileDefault =  'config.yaml';

// 設定ファイルが無いときの省略値（必ず設定する）
// ys, dx, dy, ascent は '*' を指定可能で、値を算出する
const dataDefault = {
	'fontFileName': 'brailleFont',
	'fontName': null,
	'description': 'eight-dot braille fonts', 
	'version': '1.0', 
	'copyright': '© takayan', 
	'url': 'https://neu101.seesaa.net/', 
	'sixDot': false,
	'kana': false,
	'kantenji': true,
	'shiftKantenji': false,
	'blackMark': 'square',
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
	'ys': 1250, 
	'dx': 490,
	'dy': 480,
	'radius': 175,
	'thickness': 30,
	'pinRadius': 50,
};
let data = {};
Object.assign(data , dataDefault);

// コマンドラインの処理
program
  .version('0.0.1')
  .option('-c, --config <configFile>', 'YAML-formated config file name', configFileDefault )
  .option('-f, --fontfile <fontFileName>', `font file basename (default: "${data['fontFileName']}")` )
  .parse(process.argv);

// 不明な引数があるときは終了する
if ( program.args.length > 0 ) {
	if (program.args.length == 1 ) {
		console.error(program._name, ": unknown argument: ", program['args'][0] );
	} else {
		console.error(program._name, ": unknown arguments: ", program['args'].join(', ') );
	}
	program.help();
}

// 設定ファイルを読み込む
const configFile = program['config'];
if ( fs.existsSync(configFile) ) {
	data = Object.assign(data, yaml.safeLoad(fs.readFileSync(configFile, 'utf8')));
}

// 要素が無ければ、省略値を入れる
Object.keys(dataDefault).forEach(
	item => { if (data[item]==null) data[item] = dataDefault[item]});

// 文字上端の値
if ( data['ascent'] == '*' ) {
	data['ascent'] = data['unitsPerEm'] + data['descent'];
}

// ファイル名を取得する
const fileName = program['fontfile']!=undefined ?
	program['fontfile'] : data['fontFileName'];

// 六点点字のみ作成かどうか
const sixDot =  data['sixDot'];

// 八点点字を漢点字として扱うか
//（最上段を追加の点とする。ただしこれだけではユニコード点字の配置は変えない。）
// 六点点字のみのときは無意味
const kantenji =  sixDot ? false : data['kantenji'];

// 特殊な漢点字のために最下段を最上段にシフトして表示する
// 始点終点情報をユニコード点字の7点8点で保存した場合用
const shiftKantenji = kantenji ? data['shiftKantenji'] : false;

// 点の印
const blackMarkArr = [ 'dot', 'square', 'diamond' ];
const blackMark =  blackMarkArr.indexOf(data['blackMark']) >= 0 ?
	data['blackMark'] : blackMarkArr[0];

// 作成する点なしの印
const whiteMarkArr = [ 'empty', 'dash', 'pin', 'outline' ];
const whiteMark =  whiteMarkArr.indexOf(data['whiteMark']) >= 0 ?
	data['whiteMark'] : whiteMarkArr[1];

// ユニコード点字範囲
const start = 0x2800;
const end = sixDot ? 0x283f : 0x28ff;

// フォントの幅
if (data['horizAdvX'] == '*' ) {
	data['horizAdvX'] = data['xs']*2+ data['radius']*2 + data['dx'];
}

// 名前の作成
const blackMarkIDHash =  { 'dot': 'Dot', 'square': 'Square', 'diamond': 'Diamond' };
const whiteMarkIDHash =  { 'empty': '', 'dash': 'Dash', 'pin': 'Pin', 'outline': 'Outline' };
const fontId = `${ sixDot ? 'Six' : 'Eight' }-${blackMarkIDHash[blackMark]}${whiteMarkIDHash[whiteMark]}-Braille${shiftKantenji?'-Shifted':''}`;
const whiteMarkHash =  { 'empty': '', 'dash': '-dash', 'pin': '-pin', 'outline': '-outline' };
const fontFamilyName = (data['fontName']!=null) ? data['fontName'] :
	`${ sixDot ? 'six' : 'eight' } ${blackMark}${ whiteMarkHash[whiteMark]} braille${shiftKantenji?' shifted':''}`;

// 漢点字向けに六点点字を下にスライドした文字コードを返す
// 六点点字以外ならば、そのものを返す
const slideDown = code => ( code <= 0x2800 && code > 0x2840 ) ? code : (
	( ( code & 0b00011011) << 1 ) 
	| ( code & 0b00000100 ? 0b01000000 : 0 )
	| ( code & 0b00100000 ? 0b10000000 : 0 ) );

// 最下段、何もなければ空点の印を除外（六点点字のみを作る場合用）
const bottomWhiteExclude = sixDot;

// 最上段、何もなければ空点の印を除外（八点点字の下の六点のみを使う場合用）
// 漢点字の場合、三マス漢点字のニマス目も除外されてしまうので要らない
const topWhiteExclude = false;

// ●を描く操作
const dotMovement = ( x, y, c ) => 
	`M ${data['xs']+data['dx']*x+c*data['horizAdvX']},${data['ys']-data['dy']*y} `
	+ `a ${data['radius']},${data['radius']} 0,1,0 ${ data['radius']*2},0 `
	+ `a ${data['radius']},${data['radius']} 0,1,0 ${-data['radius']*2},0 Z `;

// ■を描く操作
const squareMovement = ( x, y, c ) =>
	`M ${data['xs']+data['dx']*x+c*data['horizAdvX']},${data['ys'] + (data['radius'])-data['dy']*y} `
	+ `h ${data['radius']*2} v ${-data['radius']*2} h ${-data['radius']*2} v ${+data['radius']*2} Z `;

// ◆を描く操作
const diamondMovement = ( x, y, c ) =>
	`M ${data['xs']+data['dx']*x+c*data['horizAdvX']},${data['ys']-data['dy']*y} `
	+ `l ${ data['radius']}, ${ data['radius']} l ${ data['radius']}, ${-data['radius']} `
	+ `l ${-data['radius']}, ${-data['radius']} l ${-data['radius']}, ${ data['radius']} Z `;

// ○を描く操作
const outlineMovement = ( x, y, c ) =>
	`M ${data['xs']+data['dx']*x+c*data['horizAdvX']},${data['ys']-data['dy']*y} `
	+ `a ${data['radius']},${data['radius']} 0,1,0 ${ data['radius']*2},0 `
	+ `a ${data['radius']},${data['radius']} 0,1,0 ${-data['radius']*2},0 `
	+ `m ${data['thickness']},0 `
	+ `a ${data['radius']-data['thickness']},${data['radius']-data['thickness']} 0,1,1 ${ (data['radius']-data['thickness'])*2},0 `
	+ `a ${data['radius']-data['thickness']},${data['radius']-data['thickness']} 0,1,1 ${-(data['radius']-data['thickness'])*2},0 Z `;

// □を描く操作
const whiteSquareMovement = ( x, y, c ) =>
	`M ${data['xs']+data['dx']*x+c*data['horizAdvX']},${data['ys'] + (data['radius'])-data['dy']*y} `
	+ `h ${data['radius']*2} v ${-data['radius']*2} h ${-data['radius']*2} v ${+data['radius']*2} `
	+ `m ${data['thickness']},${-data['thickness']}`
	+ `v ${-(data['radius']*2-data['thickness']*2)} h ${ (data['radius']*2-data['thickness']*2)} `
	+ `v ${ (data['radius']*2-data['thickness']*2)} h ${-(data['radius']*2-data['thickness']*2)} Z `;

// ◇を描く操作
const whiteDiamondMovement = ( x, y, c ) =>
	`M ${data['xs']+data['dx']*x+c*data['horizAdvX']},${data['ys']-data['dy']*y} `
	+ `l ${ data['radius']}, ${ data['radius']} `
	+ `l ${ data['radius']}, ${-data['radius']} `
	+ `l ${-data['radius']}, ${-data['radius']} `
	+ `l ${-data['radius']}, ${ data['radius']} `
	+ `m ${data['thickness']},0 `
	+ `l ${ (data['radius']-data['thickness'])}, ${-(data['radius']-data['thickness'])}`
	+ `l ${ (data['radius']-data['thickness'])}, ${ (data['radius']-data['thickness'])} `
	+ `l ${-(data['radius']-data['thickness'])}, ${ (data['radius']-data['thickness'])} `
	+ `l ${-(data['radius']-data['thickness'])}, ${-(data['radius']-data['thickness'])} Z `;

// 輪郭を描く操作
const outlineHash = {
	'dot': outlineMovement,
	'square': whiteSquareMovement,
	'diamond': whiteDiamondMovement,
};
const outlineMarkMovement = ( x, y, c ) => outlineHash[blackMark]( x, y, c );

// 空線を描く操作
const dashMovement = ( x, y, c ) =>
	`M ${data['xs']+data['dx']*x+c*data['horizAdvX']},${data['ys'] + (data['thickness']/2)-data['dy']*y} `
	+ `h ${data['radius']*2} v ${-data['thickness']} h ${-data['radius']*2} v ${+data['thickness']} Z `;

// 空点を描く操作
const pinMovement = ( x, y, c ) =>
	`M ${data['xs']+data['radius']-data['pinRadius']+data['dx']*x+c*data['horizAdvX']},${data['ys']-data['dy']*y} `
	+ `a ${data['pinRadius']},${data['pinRadius']} 0,1,0 ${ data['pinRadius']*2},0 `
	+ `a ${data['pinRadius']},${data['pinRadius']} 0,1,0 ${-data['pinRadius']*2},0 Z `;

// 何も描かない操作
const emptyMovement = ( x, y, c ) => '';

// 黒点を描く操作
const blackMovementHash = {
	'dot': dotMovement,
	'square': squareMovement,
	'diamond': diamondMovement,
};
const blackMarkMovement = ( x, y, c ) => blackMovementHash[blackMark]( x, y, c );

// 白点を描く操作
const whiteMarkMovementHash = {
	'empty': emptyMovement,
	'pin': pinMovement,
	'dash': dashMovement,
	'outline': outlineMarkMovement,
};
const whiteMarkMovement = ( x, y, c ) => whiteMarkMovementHash[whiteMark]( x, y, c );

// 指定された点字の図形を作成する
const movement = codeArray => {
	let result = '';
	let counter = 0;
	for ( const code of codeArray ) {
		for ( const bit of [0,1,2,3,4,5,6,7]) {
			const pos = !shiftKantenji ?
				{ 0: [0,0], 1: [0,1], 2: [0,2], 6: [0,3], 3: [1,0], 4: [1,1], 5: [1,2], 7: [1,3] }
				: { 0: [0,1], 1: [0,2], 2: [0,3], 6: [0,0], 3: [1,1], 4: [1,2], 5: [1,3], 7: [1,0] };
			const [ x, y ] = pos[bit];
			if ( (code - start) & (1<<bit) ) {
				result += blackMarkMovement( x, y, counter );
			} else if (( ! bottomWhiteExclude || ( (code - start) >= 0x40 ) || ( bit != 6 && bit != 7 )) &&
				( ! topWhiteExclude || ( (code - start) & 0b1001 != 0  ) || ( bit != 0 && bit != 3 ))) {
				result += whiteMarkMovement( x, y, counter );
			} else {
				result += '';
			}
		}
		counter ++;
	}
	return result;
}

// グリフデータを作成する
const generateGryph = ( number, code ) => {
	if ( number == null || number == ''  ) {
		return '';
	}
	if ( typeof (number) == "string" || number instanceof String ) {
		number = number.charCodeAt(0);
	}
	const codeArray = isNaN(code) ?
		[...code].map( ch => ch.charCodeAt(0) ) : [code];

	// グリフタグのテンプレートに展開
	return `\
      <glyph
        glyph-name="uni${ number.toString(16).padStart( 4, '0' ).toUpperCase() }"
        unicode="&#x${ number.toString(16).padStart( 4, '0' )  };"
        horiz-adv-x="${data['horizAdvX']*codeArray.length}"
        d="${ movement(codeArray) }" />`;
}

// ユニコード点字のグリフを作成
let glyphs = ''
for ( let code = start; code <= end; code ++ ) {
	glyphs += generateGryph(code,code) + '\n';
}

// ユニコード点字以外の文字を点字にするときは、どのユニコード点字と同じかを指示する

// ライトハウス墨点字フォント互換
const characterHash = {
',':'⠂', '0':'⠚', '1':'⠁', '2':'⠃', '3':'⠉', '4':'⠙', '5':'⠑', '6':'⠋', '7':'⠛', '8':'⠓', '9':'⠊', ':':'⠒', 
'A':'⠁', 'B':'⠃', 'C':'⠉', 'D':'⠙', 'E':'⠑', 'F':'⠋', 'G':'⠛', 'H':'⠓', 'I':'⠊', 'J':'⠚', 'K':'⠅', 'L':'⠇', 'M':'⠍', 
'N':'⠝', 'O':'⠕', 'P':'⠏', 'Q':'⠟', 'R':'⠗', 'S':'⠎', 'T':'⠞', 'U':'⠥', 'V':'⠧', 'W':'⠺', 'X':'⠭', 'Y':'⠽', 'Z':'⠵', 
'a':'⠁', 'b':'⠃', 'c':'⠉', 'd':'⠙', 'e':'⠑', 'f':'⠋', 'g':'⠛', 'h':'⠓', 'i':'⠊', 'j':'⠚', 'k':'⠅', 'l':'⠇', 'm':'⠍', 
'n':'⠝', 'o':'⠕', 'p':'⠏', 'q':'⠟', 'r':'⠗', 's':'⠎', 't':'⠞', 'u':'⠥', 'v':'⠧', 'w':'⠺', 'x':'⠭', 'y':'⠽', 'z':'⠵', 
'π':'⠠', '‖':'⠳', '‘':'⠈', '’':'⠄', '†':'⠈', '‡':'⠨', '↑':'⠘', '↓':'⠰', '∋':'⠲', '√':'⠜', '∩':'⠩', 
'∪':'⠬', '∫':'⠮', '≠':'⠨', '■':'⠿', '、':'⠰', '。':'⠲', '〃':'⠐', '「':'⠤', '」':'⠤', '〒':'⠬', 
'あ':'⠁', 'い':'⠃', 'う':'⠉', 'え':'⠋', 'お':'⠊', 'か':'⠡', 'き':'⠣', 'ぎ':'⠘', 'く':'⠩', 'け':'⠫', 'こ':'⠪', 
'さ':'⠱', 'し':'⠳', 'じ':'⠘', 'す':'⠹', 'せ':'⠻', 'そ':'⠺', 'た':'⠕', 'ち':'⠗', 'ぢ':'⠘', 'っ':'⠂', 'つ':'⠝', 'て':'⠟', 'と':'⠞', 
'な':'⠅', 'に':'⠇', 'ぬ':'⠍', 'ね':'⠏', 'の':'⠎', 'は':'⠥', 'ぱ':'⠠', 'ひ':'⠧', 'び':'⠘', 'ぴ':'⠨', 'ふ':'⠭', 'へ':'⠯', 'ほ':'⠮', 
'ま':'⠵', 'み':'⠷', 'む':'⠽', 'め':'⠿', 'も':'⠾', 'や':'⠌', 'ゆ':'⠬', 'よ':'⠜', 'ら':'⠑', 'り':'⠓', 'る':'⠙', 'れ':'⠛', 'ろ':'⠚', 
'わ':'⠄', 'ゐ':'⠆', 'ゑ':'⠖', 'を':'⠔', 'ん':'⠴', 
'ア':'⠁', 'イ':'⠃', 'ウ':'⠉', 'エ':'⠋', 'オ':'⠊', 'カ':'⠡', 'キ':'⠣', 'ギ':'⠘', 'ク':'⠩', 'ケ':'⠫', 'コ':'⠪', 
'サ':'⠱', 'シ':'⠳', 'ジ':'⠘', 'ス':'⠹', 'セ':'⠻', 'ソ':'⠺', 'タ':'⠕', 'チ':'⠗', 'ヂ':'⠘', 'ッ':'⠂', 'ツ':'⠝', 'テ':'⠟', 'ト':'⠞', 
'ナ':'⠅', 'ニ':'⠇', 'ヌ':'⠍', 'ネ':'⠏', 'ノ':'⠎', 'ハ':'⠥', 'パ':'⠠', 'ヒ':'⠧', 'ビ':'⠘', 'ピ':'⠨', 'フ':'⠭', 'ヘ':'⠯', 'ホ':'⠮', 
'マ':'⠵', 'ミ':'⠷', 'ム':'⠽', 'メ':'⠿', 'モ':'⠾', 'ヤ':'⠌', 'ユ':'⠬', 'ヨ':'⠜', 'ラ':'⠑', 'リ':'⠓', 'ル':'⠙', 'レ':'⠛', 'ロ':'⠚', 
'ワ':'⠄', 'ヰ':'⠆', 'ヱ':'⠖', 'ヲ':'⠔', 'ン':'⠴', 
'・':'⠐', 'ー':'⠒', '一':'⠂', '七':'⠶', '三':'⠒', '中':'⠐', '九':'⠔', '二':'⠆', '五':'⠢', '八':'⠦', '六':'⠖', '分':'⠌', '半':'⠠', 
'句':'⠲', '四':'⠲', '外':'⠰', '大':'⠠', '小':'⠘', '感':'⠖', '拗':'⠈', '拡':'⠸', '数':'⠼', '斜':'⠨', '根':'⠜', '濁':'⠐', '疑':'⠢', 
'継':'⠤', '語':'⠦', '郵':'⠬', '閉':'⠴', '零':'⠴', '！':'⠖', '＃':'⠼', '＄':'⠰', '％':'⠏', '＆':'⠯', '（':'⠦', '）':'⠴', '＊':'⠡', 
'＋':'⠢', '－':'⠔', '．':'⠲', '／':'⠌', 
'０':'⠚', '１':'⠁', '２':'⠃', '３':'⠉', '４':'⠙', '５':'⠑', '６':'⠋', '７':'⠛', '８':'⠓', '９':'⠊', '；':'⠆', '＝':'⠶', '？':'⠢', '＠':'⠪', 
'Ａ':'⠁', 'Ｂ':'⠃', 'Ｃ':'⠉', 'Ｄ':'⠙', 'Ｅ':'⠑', 'Ｆ':'⠋', 'Ｇ':'⠛', 'Ｈ':'⠓', 'Ｉ':'⠊', 'Ｊ':'⠚', 'Ｋ':'⠅', 'Ｌ':'⠇', 'Ｍ':'⠍', 
'Ｎ':'⠝', 'Ｏ':'⠕', 'Ｐ':'⠏', 'Ｑ':'⠟', 'Ｒ':'⠗', 'Ｓ':'⠎', 'Ｔ':'⠞', 'Ｕ':'⠥', 'Ｖ':'⠧', 'Ｗ':'⠺', 'Ｘ':'⠭', 'Ｙ':'⠽', 'Ｚ':'⠵', 
'［':'⠷', '］':'⠾', '＾':'⠘', '＿':'⠤', '｀':'⠈', 
'ａ':'⠁', 'ｂ':'⠃', 'ｃ':'⠉', 'ｄ':'⠙', 'ｅ':'⠑', 'ｆ':'⠋', 'ｇ':'⠛', 'ｈ':'⠓', 'ｉ':'⠊', 'ｊ':'⠚', 'ｋ':'⠅', 'ｌ':'⠇', 'ｍ':'⠍', 
'ｎ':'⠝', 'ｏ':'⠕', 'ｐ':'⠏', 'ｑ':'⠟', 'ｒ':'⠗', 'ｓ':'⠎', 'ｔ':'⠞', 'ｕ':'⠥', 'ｖ':'⠧', 'ｗ':'⠺', 'ｘ':'⠭', 'ｙ':'⠽', 'ｚ':'⠵', 
'｛':'⠣', '｜':'⠸', '｝':'⠜', '～':'⠤', '￥':'⠈',
'〓':'\x2800','無':'\x2800',
};

if (data['kana'] ) {
	Object.keys(characterHash).forEach(
		key => glyphs += generateGryph( key, (kantenji && !shiftKantenji) ?
			slideDown(characterHash[key].charCodeAt(0)) : characterHash[key] ) + "\n"
	);
}

// 漢点字フォントサンプル
const kantenjiHash = {
	"木": "⢏","林": "⢇⢎","森": "⢇⠚", "水": "⡏","目": "⣿",   "湘": "⡇⢆⣾", "世": "⠵⡸", "界":"⡣⠬",};
if (data['kantenji'] ) {
	Object.keys(kantenjiHash).forEach(
		key => glyphs += generateGryph( key, kantenjiHash[key] ) + "\n" );
 }

// SVG XML の作成
const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
  <metadata>
  </metadata>
  <defs>
    <font horiz-adv-x="${data['unitsPerEm']}" id="${fontId}" >
      <font-face
        font-family="${fontFamilyName}"
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

const options = {
	'copyright': data['copyright'], 
	'description': data['description'], 
	'url': data['url'], 
	'version': data['version'], 
};

// ファイル出力
console.error(`svg: ${fileName}.svg`);
fs.writeFileSync( `${fileName}.svg`, xml, { encoding: 'utf8' } );
const ttf = svg2ttf( xml, options );
console.error(`ttf: ${fileName}.ttf`);
fs.writeFileSync( `${fileName}.ttf`, new Buffer.from(ttf.buffer) );
