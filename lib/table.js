'use strict';
const kana = require('./kana');
const kantenji = require('./kantenji');
const data = module.parent.exports.data;

let table = {};

// 漢点字向けに六点点字を下にスライドした文字コードを返す
// 六点点字以外ならば、そのものを返す
const slideDown = code => (code <= 0x2800 && code > 0x2840) ? code : (
    ((code & 0b00011011) << 1) |
    (code & 0b00000100 ? 0b01000000 : 0) |
    (code & 0b00100000 ? 0b10000000 : 0));

// 仮名追加
if (data['kana']) {
    let temp = {};
    Object.keys(kana.table).forEach(key =>
        temp[key] = (data['kantenji'] && !data['shiftKantenji']) ?
        slideDown(kana.table[key].charCodeAt(0)) : kana.table[key]);
    Object.assign(table, temp);
}

// 漢点字追加
if (data['kantenji']) {
    let temp = {};
    Object.keys(kantenji.table).forEach(key => temp[key] = kantenji.table[key]);
    Object.assign(table, temp);
}

module.exports.table = table;
