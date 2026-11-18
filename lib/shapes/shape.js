'use strict';
// この基底クラスでは黒点の形が分からなくても描ける標準的な白点（点が無い印）の形のみを定義する。
// 黒点の形は継承したクラスで定義する。輪郭タイプの白点も形が分からないと描けないので、継承先で定義する。
module.exports = class Shape {

    constructor(data) {

        // 各関数の x,y,c は次の意味を持つ。
        // x [0,1] 点が左か右かを表す。
        // y [0,1,2,3] 点の上からの位置を表す。
        // c [0...] 何番目のマスかを表す。

        // 何もしない
        this.emptyMovement = (x, y, c) => '';

        this.blackMovement = this.emptyMovement;
        this.whiteMovements = {};

        // 空点を描く
        this.whiteMovements['pin'] = (x, y, c) =>
            `M ${data['xs'] - data['radius'] + data['radius'] - data['pinRadius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] - data['dy'] * y} ` +
            `a ${data['pinRadius']},${data['pinRadius']} 0,1,0 ${data['pinRadius'] * 2},0 ` +
            `a ${data['pinRadius']},${data['pinRadius']} 0,1,0 ${-data['pinRadius'] * 2},0 Z `;

        // 空線を描く
        this.whiteMovements['dash'] = (x, y, c) =>
            `M ${data['xs'] - data['radius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['thickness'] / 2) - data['dy'] * y} ` +
            `h ${data['radius'] * 2} v ${-data['thickness']} h ${-data['radius'] * 2} Z `;
    }

    // 黒点を描画する動作（shapeloaderで利用する）
    get BlackMovement() {
        return this.blackMovement;
    }

    // 白点を描画する動作の連想配列（shapeloaderで利用する）
    get WhiteMovements() {
        return this.whiteMovements;
    }

    // 白点の種類（shapeseekerで利用する）
    get WhiteMarks() {
        return Object.keys(this.whiteMovements);
    }
};
