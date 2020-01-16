'use strict';
const Shape = require('./shape');
module.exports = class Square extends Shape {
	constructor(data) {
		super(data);

		// ■を描く
		this.blackMovement = (x, y, c) =>
			`M ${data['xs'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['radius']) - data['dy'] * y} ` +
			`h ${data['radius'] * 2} v ${-data['radius'] * 2} h ${-data['radius'] * 2} v ${+data['radius'] * 2} Z `;

		if (data['whiteMark'] === 'outline') {
			// □を描く
			this.whiteMovement = (x, y, c) =>
				`M ${data['xs'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['radius']) - data['dy'] * y} ` +
				`h ${data['radius'] * 2} v ${-data['radius'] * 2} h ${-data['radius'] * 2} v ${+data['radius'] * 2} ` +
				`m ${data['thickness']},${-data['thickness']}` +
				`v ${-(data['radius'] * 2 - data['thickness'] * 2)} h ${(data['radius'] * 2 - data['thickness'] * 2)} ` +
				`v ${(data['radius'] * 2 - data['thickness'] * 2)} h ${-(data['radius'] * 2 - data['thickness'] * 2)} Z `;

		} else if (data['whiteMark'] === 'pin') {
			// 四角の小さな点を描く
			this.whiteMovement = (x, y, c) =>
				`M ${data['xs'] + data['radius'] - data['pinRadius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['pinRadius']) - data['dy'] * y} ` +
				`h ${data['pinRadius'] * 2} v ${-data['pinRadius'] * 2} h ${-data['pinRadius'] * 2} v ${+data['pinRadius'] * 2} Z `;
		}
	}
};