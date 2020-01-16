'use strict';
const Shape = require('./shape');
module.exports = class Diamond extends Shape {

	constructor(data) {
		super(data);

		// ◆を描く
		this.blackMovement = (x, y, c) =>
			`M ${data['xs'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] - data['dy'] * y} ` +
			`l ${data['radius']}, ${data['radius']} l ${data['radius']}, ${-data['radius']} ` +
			`l ${-data['radius']}, ${-data['radius']} l ${-data['radius']}, ${data['radius']} Z `;

		if (data['whiteMark'] === 'outline') {
			// ◇を描く
			this.whiteMovement = (x, y, c) =>
				`M ${data['xs'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] - data['dy'] * y} ` +
				`l ${data['radius']}, ${data['radius']} ` +
				`l ${data['radius']}, ${-data['radius']} ` +
				`l ${-data['radius']}, ${-data['radius']} ` +
				`l ${-data['radius']}, ${data['radius']} ` +
				`m ${data['thickness']},0 ` +
				`l ${(data['radius'] - data['thickness'])}, ${-(data['radius'] - data['thickness'])}` +
				`l ${(data['radius'] - data['thickness'])}, ${(data['radius'] - data['thickness'])} ` +
				`l ${-(data['radius'] - data['thickness'])}, ${(data['radius'] - data['thickness'])} ` +
				`l ${-(data['radius'] - data['thickness'])}, ${-(data['radius'] - data['thickness'])} Z `;
		}
	}
};