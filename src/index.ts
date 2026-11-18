#!/usr/bin/env node
// 外部モジュールインポート
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from 'js-yaml';
import svg2ttf from "svg2ttf";
import i18n from "i18n";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

// 内部モジュールインポート
import ShapeSeeker from "./shapeseeker.js";
import ShapeLoader from "./shapeloader.js";
import Characters from "./lib/table.js";
import type { FontData } from "./fontdata.js";
import { fontDataDefault } from "./fontdata.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// パッケージ設定ファイル
const packagejson = JSON.parse(
	fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

// locale関連
const resourceDirectory = path.resolve(__dirname, "..");
const localedir = path.join(resourceDirectory, "locales");
const locales = fs.readdirSync(localedir).reduce((acc: Array<string>, file: string) => {
	const ext = ".json";
	if (path.extname(file) === ext) {
		acc.push(file.slice(0, -ext.length));
	}
	return acc;
}, []);
const lang = process.env.LANG?.slice(0, 2) ?? "en";
const locale = locales.includes(lang) ? lang : "en";

// i18n設定
i18n.configure({
	locales: locales,
	defaultLocale: locale,
	directory: localedir,
});

// yargs文字列の追加翻訳
let yargsLocale: { [key: string]: { [key: string]: string } } = {
	"en": {},
	"ja": { "boolean": "論理値" },
};

// 標準の設定ファイル名
const configFileDefault: string = "config.yaml";
// 標準の設定フォルダ名
const configDirectory: string = "config";

// 標準値を代入
let data: FontData = { ...fontDataDefault };

// コマンドラインオプションの定義
const options = yargs(hideBin(process.argv))
	.scriptName(packagejson.name)
	.locale(locale)
	.updateStrings(yargsLocale[locale] as { [key: string]: string })
	.usage(i18n.__("Usage: $0 [options]"))
	.version(
		"version",
		i18n.__("output the version number"),
		packagejson.version,
	)
	.alias("version", "v")
	.help("help", i18n.__("display help for command"))
	.alias("help", "h")
	.option("config", {
		alias: "c",
		type: "string",
		describe: i18n.__("YAML-formated configuration file name"),
		//default: configFileDefault,
	})
	.option("fontfile", {
		alias: "f",
		type: "string",
		describe: i18n.__("basename of output font file"),
	})
	.option("list", {
		alias: "l",
		type: "boolean",
		describe: i18n.__("list configuration files in <config> directory"),
		default: false,
	})
	.option("shapes", {
		alias: "s",
		type: "boolean",
		describe: i18n.__("list available shapes"),
		default: false,
	})
	.option("svgxml", {
		alias: "x",
		type: "boolean",
		describe: i18n.__("output SVGXML file"),
		default: false,
	})
	.strict()
	.parseSync();

// 設定ファイルのリスト表示の指示があれば出力する
if (options.list) {
	const configDir = path.join(resourceDirectory, configDirectory);
	console.log(
		`${i18n.__("configuration directory:")} ${configDir
		}`,
	);
	console.log(i18n.__("configuration files:"));
	fs.readdirSync(configDir).forEach((file: string) => {
		if (path.extname(file) === ".yaml") {
			const conf: any = yaml.load(
				fs.readFileSync(path.join(configDir, file), "utf8"),
			);
			console.log(`${file}\t${conf.description}`);
		}
	});
}

// 利用可能な点字の図形リストを出力する
if (options.shapes) {
	const shapes = await ShapeSeeker.create(data);
	console.log(i18n.__("available shapes:"));
	Object.entries(shapes.whiteMarks).forEach(([key, marks]) => {
		console.log(`${key}: [${marks.join(", ")}]`);
	});
}

// 上記の出力があれば、終了する。
if (options.list || options.shapes) {
	process.exit(0);
}

// 設定ファイルからの入力データ容器
let inputData: { [key: string]: any } = {};

// 設定ファイルの読み込み
const configFile = options.config || configFileDefault;
if (fs.existsSync(configFile)) {
	console.error(`config: ${configFile}`);
	inputData = Object.assign(
		inputData,
		yaml.load(fs.readFileSync(configFile, "utf8")),
	);
} else if (path.dirname(configFile) === ".") {
	const defaultConfig = path.join(resourceDirectory, configDirectory, configFile);
	if (fs.existsSync(defaultConfig)) {
		console.error(`config: ${defaultConfig}`);
		inputData = Object.assign(
			inputData,
			yaml.load(fs.readFileSync(defaultConfig, "utf8")),
		);
	} else if (options.config != undefined) {
		console.error(
			`${packagejson.name} : ${i18n.__("configuration file not found")
			}: ${configFile}`,
		);
		process.exit(1);
	}
} else {
	console.error(
		`${packagejson.name} : ${i18n.__("configuration file not found")
		}: ${configFile}`,
	);
	process.exit(1);
}

// 論理型。型が違えば強制終了
["sixDot", "kana", "kantenji", "shiftKantenji"].forEach((key) => {
	if (inputData[key] != null && typeof (inputData[key]) != "boolean") {
		console.log(i18n.__("the value of item '%s' is not a boolean type.", key));
		process.exit(1);
	}
});

// 数値型。型が違えば強制終了。
[
	"unitsPerEm",
	"descent",
	"underlineThickness",
	"underlinePosition",
	"xs",
	"ys",
	"dx",
	"dy",
	"radius",
	"pinRadius",
	"thickness",
].forEach((key: string) => {
	if (inputData[key] != null && (typeof (inputData[key]) !== "number" || !Number.isFinite(inputData[key]))) {
		console.log(i18n.__("the value of item '%s' is not a numeric type.", key));
		process.exit(1);
	}
});

// 数値型もしくは*。違えば強制終了
["horizAdvX", "ascent"].forEach((key) => {
	if (
		inputData[key] != null &&
		(typeof (inputData[key]) !== "number" || !Number.isFinite(Number(inputData[key]))) && inputData[key] !== "*"
	) {
		console.log(i18n.__("the value of item '%s' is neither a numeric type nor '*'.", key));
		process.exit(1);
	}
});

// 文字列（キーワード)か数値。キーワードの確認はここではしない。
// 数値でも文字列でもないときは、文字列に変換して続ける。
["weight"].forEach((key) => {
	if (
		inputData[key] != null && typeof (inputData[key]) != "string" &&
		typeof (inputData[key]) !== "number"
	) {
		inputData[key] = inputData[key].toString();
	}
});

// 文字列。文字列でないときは文字列に変換して続ける。
[
	"fontFileName",
	"fontName",
	"description",
	"version",
	"blackMark",
	"whiteMark",
	"stretch",
	"copyright",
	"url",
].forEach((key) => {
	if (inputData[key] != null && typeof (inputData[key]) != "string") {
		inputData[key] = inputData[key].toString();
	}
});

// 入力値があれば入力値とし、なければ省略値とする
data.fontFileName = inputData.fontFileName ?? data.fontFileName;
data.fontName = inputData.fontName ?? data.fontName;
data.description = inputData.description ?? data.description;
data.version = inputData.version ?? data.version;
data.copyright = inputData.copyright ?? data.copyright;
data.url = inputData.url ?? data.url;
data.sixDot = inputData.sixDot ?? data.sixDot;
data.kana = inputData.kana ?? data.kana;
data.kantenji = inputData.kantenji ?? data.kantenji;
data.shiftKantenji = inputData.shiftKantenji ?? data.shiftKantenji;
data.blackMark = inputData.blackMark ?? data.blackMark;
data.whiteMark = inputData.whiteMark ?? data.whiteMark;
data.unitsPerEm = inputData.unitsPerEm ?? data.unitsPerEm;
data.horizAdvX = inputData.horizAdvX ?? data.horizAdvX;
data.ascent = inputData.ascent ?? data.ascent;
data.descent = inputData.descent ?? data.descent;
data.weight = inputData.weight ?? data.weight;
data.stretch = inputData.stretch ?? data.stretch;
data.underlineThickness = inputData.underlineThickness ?? data.underlineThickness;
data.underlinePosition = inputData.underlinePosition ?? data.underlinePosition;
data.xs = inputData.xs ?? data.xs;
data.ys = inputData.ys ?? data.ys;
data.dx = inputData.dx ?? data.dx;
data.dy = inputData.dy ?? data.dy;
data.radius = inputData.radius ?? data.radius;
data.thickness = inputData.thickness ?? data.thickness;
data.pinRadius = inputData.pinRadius ?? data.pinRadius;

// 文字上端の値
if (data.ascent === "*") {
	data.ascent = data.unitsPerEm + data.descent;
}

// フォントの幅
if (data.horizAdvX === "*") {
	data.horizAdvX = data.xs * 2 + data.dx;
}

// ファイル名を取得する
const fileName = options.fontfile ?? data.fontFileName;

// 八点点字を漢点字として扱うか
//（最上段を追加の点とする。ただしこれだけではユニコード点字の配置は変えない。）
// 六点点字のみのときは無意味
data.kantenji = data.sixDot ? false : data.kantenji;

// 特殊な漢点字のために最下段を最上段にシフトして表示する
// 始点終点情報をユニコード点字の7点8点で保存した場合用
data.shiftKantenji = data.kantenji ? data.shiftKantenji : false;

// フォントIDは設定要素からアルファベットで自動的に生成する
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const fontID = (data.sixDot ? "Six-" : "Eight-") +
	capitalize(data.blackMark) +
	(data.whiteMark === "empty" ? "" : `${capitalize(data.whiteMark)}`) +
	(data.kantenji ? "-Kantenji" : "-Braille") +
	(data.shiftKantenji ? "-Shifted" : "");

// フォント名が指定されていなければ、設定要素から生成する
if (data.fontName == "" || data.fontName == null) {
	data.fontName = (data.sixDot ? "six " : "eight ") +
		data.blackMark +
		(data.whiteMark === "empty" ? " " : `-${data.whiteMark} `) +
		(data.kantenji ? "kantenji" : "braille") +
		(data.shiftKantenji ? " shifted" : "");
}

// 最下段、何もなければ空点の印を除外（六点点字のみを作る場合に指定）
const bottomWhiteExclude = data.sixDot;

// 最上段、何もなければ空点の印を除外（八点点字の下の六点部分を使う場合に指定）
// 漢点字の場合、三マス漢点字のニマス目も除外されてしまうので使わない
const topWhiteExclude = false;

// 図形描画関数を設定する
let shape = null;
try {
	shape = await ShapeLoader.create(data);
} catch (e) {
	if (e instanceof Error) {
		if (e.message === "unknown blackMark shape: %s" || e.message === "unknown whiteMark shape: %s") {
			console.error(i18n.__(e.message, e.message.includes("blackMark") ? data.blackMark : data.whiteMark));
		} else {
			console.log(i18n.__(e.message));
		}
	}
	process.exit(1);
}

// unicode点字の範囲
const ucb_start: number = 0x2800;
const ucb_end: number = data.sixDot ? 0x283f : 0x28ff;

// 指定された点字の図形を作成する
const movement = (codeArray: Array<number>) => {
	let result = "";
	let counter = 0;
	for (const code of codeArray) {
		for (const bit of [0, 1, 2, 3, 4, 5, 6, 7]) {
			const pos: { [key: number]: Array<number> } = !data.shiftKantenji
				? {
					0: [0, 0],
					1: [0, 1],
					2: [0, 2],
					6: [0, 3],
					3: [1, 0],
					4: [1, 1],
					5: [1, 2],
					7: [1, 3],
				}
				: {
					0: [0, 1],
					1: [0, 2],
					2: [0, 3],
					6: [0, 0],
					3: [1, 1],
					4: [1, 2],
					5: [1, 3],
					7: [1, 0],
				};
			const pair: Array<number> = pos[bit] as Array<number>;
			const x: number = pair[0] as number;
			const y: number = pair[1] as number;
			if ((code - ucb_start) & (1 << bit)) {
				result += shape.blackMovement(x, y, counter);
			} else if (
				(!bottomWhiteExclude || ((code - ucb_start) >= 0x40) ||
					(bit != 6 && bit != 7)) &&
				(!topWhiteExclude || (((code - ucb_start) & 0b1001) != 0) ||
					(bit != 0 && bit != 3))
			) {
				result += shape.whiteMovement(x, y, counter);
			} else {
				result += "";
			}
		}
		counter++;
	}
	return result;
};

// グリフデータを作成する
const generateGryph = (number: number | string, code: number | string) => {
	if (number === null || number === "") {
		return "";
	}
	if (typeof number === "string") {
		number = number.charCodeAt(0);
	}
	const codeArray: Array<number> = typeof (code) !== "number"
		? [...code].map((ch) => ch.charCodeAt(0))
		: [code];

	// グリフタグのテンプレートに展開
	return `\
      <glyph
        glyph-name="uni${number.toString(16).padStart(4, "0").toUpperCase()}"
        unicode="&#x${number.toString(16).padStart(4, "0")};"
        horiz-adv-x="${(data.horizAdvX as number) * codeArray.length}"
        d="${movement(codeArray)}" />`;
};

// ユニコード点字のグリフを作成する
// let glyphs = "";
// for (let code = start; code <= end; code++) {
// 	glyphs += generateGryph(code, code) + "\n";
// }
//const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);

const range = (s: number, e: number) =>
	Array.from(
		{ length: e - s + 1 },
		(_, i) => s + i,
	);

// ユニコード点字
const glyphs_unicode = range(ucb_start, ucb_end).reduce(
	(acc: string, ch: number) => acc + generateGryph(ch, ch) + "\n",
	"",
);
//console.log("glyphs:", glyphs_unicode);

// 追加テーブルで指定された文字のグリフを作成する
//const characters = new Characters(data);
const glyphs_characters = Object.entries((new Characters(data)).table).reduce(
	(acc: string, [ch, braille]) => acc + generateGryph(ch, braille as string) + "\n",
	"",
);
//console.log("glyphs:", glyphs_characters);

// XMLに挿入する文字列をエスケープする関数
const escapeXMLAttr = (value: string) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("'", "&apos;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");

// SVG XML の作成
const xml = `\
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
  <metadata>
  </metadata>
  <defs>
    <font horiz-adv-x="${data.unitsPerEm}" id="${escapeXMLAttr(fontID)}" >
      <font-face
        font-family="${escapeXMLAttr(data.fontName)}"
        units-per-em="${data.unitsPerEm}"
        unicode-range="U+0020-FFEE"
        font-weight="${escapeXMLAttr(data.weight as string)}"
        font-stretch="${escapeXMLAttr(data.stretch)}"
        ascent="${data.ascent}"
        descent="${data.descent}"
        underline-thickness="${data.underlineThickness}"
        underline-position="${data.underlinePosition}"
         />
      <missing-glyph d="" />
      <glyph glyph-name="nonmarkingreturn" d="" />
${glyphs_unicode}
${glyphs_characters}
    </font>
  </defs>
</svg>`;

// ファイル出力
const xmlOptions = {
	copyright: data.copyright,
	description: data.description,
	url: data.url,
	version: data.version,
};
const parent = path.dirname(fileName);
fs.stat(parent, (error, stats) => {
	// 必要ならば出力先フォルダ作成
	if (error && error.code === "ENOENT") {
		try {
			fs.mkdirSync(parent, { recursive: true });
		} catch (error) {
			if (error) {
				console.error(
					`${packagejson.name} : ${i18n.__("cannot create output directory.")
					}`,
				);
				process.exit(1);
			}
		}
	}

	// フォント名候補ジェネレーター
	function* newNameGenerator(): Generator<string> {
		for (let count = 1; ; count++) {
			const candidate = count === 1 ? fileName : `${fileName}(${count})`;
			if (
				!(options.svgxml && fs.existsSync(`${candidate}.svg`)) &&
				!fs.existsSync(`${candidate}.ttf`)
			) {
				yield candidate;
			}
		}
	}

	try {
		// 変換は一度だけ行い、名前の衝突時には保存だけ再試行する。
		const ttf = Buffer.from(svg2ttf(xml, xmlOptions).buffer);
		for (const newFile of newNameGenerator()) {
			const createdPaths: string[] = [];
			let retryCollision = false;
			let cleanupFailed = false;

			const save = (outputPath: string, content: string | Buffer) => {
				let fd: number;
				try {
					fd = fs.openSync(outputPath, "wx");
				} catch (error) {
					retryCollision = (error as NodeJS.ErrnoException).code === "EEXIST";
					throw error;
				}
				createdPaths.push(outputPath);
				let writeFailed = false;
				try {
					fs.writeFileSync(fd, content);
				} catch (error) {
					writeFailed = true;
					throw error;
				} finally {
					try {
						fs.closeSync(fd);
					} catch (closeError) {
						if (!writeFailed) throw closeError;
						console.error(i18n.__("failed to close file '%s':", outputPath), closeError);
					}
				}
			};

			try {
				if (options.svgxml) save(`${newFile}.svg`, xml);
				save(`${newFile}.ttf`, ttf);
			} catch (error) {
				// この候補で自分が新規作成したファイルだけを削除する。
				for (const outputPath of createdPaths.reverse()) {
					try {
						fs.unlinkSync(outputPath);
					} catch (cleanupError) {
						cleanupFailed = true;
						console.error(i18n.__("failed to delete file '%s':", outputPath), cleanupError);
					}
				}
				if (retryCollision && !cleanupFailed) continue;
				throw error;
			}

			if (options.svgxml) console.error(`svg: ${newFile}.svg`);
			console.error(`ttf: ${newFile}.ttf`);
			return;
		}
	} catch (error) {
		console.error(i18n.__("failed to generate or save font:"), error);
		process.exitCode = 1;
	}
});
