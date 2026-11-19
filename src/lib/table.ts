import { kanaTable } from "./kana.js";
import type { FontData } from "../fontdata.js";

export default class Table {
    table: { [key: string]: string } = {};
    constructor(data: FontData) {

        // 漢点字向けに六点点字を下にスライドした文字コードを返す
        // 六点点字以外ならば、そのものを返す
        const slideDown = (code: number) =>
            (code < 0x2800 || code >= 0x2840) ? code : (
                ((code & 0b00011011) << 1) |
                (code & 0b00000100 ? 0b01000000 : 0) |
                (code & 0b00100000 ? 0b10000000 : 0)
            );

        // 仮名追加
        if (data.kana) {
            this.table = Object.fromEntries(
                Object.entries(kanaTable).map(([key, braille]) => [
                    key,
                    (data.kantenji && !data.shiftKantenji)
                        ? String.fromCharCode(slideDown(braille.charCodeAt(0)))
                        : braille,
                ]),
            );
        }
    }
}
