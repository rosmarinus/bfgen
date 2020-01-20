'use strict';
module.exports = class Shape {

    constructor(data) {

        // 何もしない
        const emptyMovement = (x, y, c) => '';

        // 空点を描く
        const pinMovement = (x, y, c) =>
            `M ${data['xs'] - data['radius'] + data['radius'] - data['pinRadius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] - data['dy'] * y} ` +
            `a ${data['pinRadius']},${data['pinRadius']} 0,1,0 ${data['pinRadius'] * 2},0 ` +
            `a ${data['pinRadius']},${data['pinRadius']} 0,1,0 ${-data['pinRadius'] * 2},0 Z `;

        // 空線を描く
        const dashMovement = (x, y, c) =>
            `M ${data['xs'] - data['radius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['thickness'] / 2) - data['dy'] * y} ` +
            `h ${data['radius'] * 2} v ${-data['thickness']} h ${-data['radius'] * 2} Z `;

        this.blackMovement = emptyMovement;
        this.whiteMovement =
            data['whiteMark'] === 'pin' ? pinMovement :
                data['whiteMark'] === 'dash' ? dashMovement :
                    emptyMovement;
    }
};
