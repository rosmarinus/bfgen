'use strict';
const Shape = require('./shape');
module.exports = class Square extends Shape {
	constructor(data) {
		super(data);

		this.blackMovement = (x, y, c) =>
			`M ${data['xs'] - data['radius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['radius']) - data['dy'] * y} ` +
			`h ${data['radius'] * 2} v ${-data['radius'] * 2} h ${-data['radius'] * 2} Z `;

		this.whiteMovements['outline'] = (x, y, c) =>
			`M ${data['xs'] - data['radius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['radius']) - data['dy'] * y} ` +
			`h ${data['radius'] * 2} v ${-data['radius'] * 2} h ${-data['radius'] * 2} Z` +
			`m ${data['thickness']},${-data['thickness']}` +
			`v ${-(data['radius'] * 2 - data['thickness'] * 2)} h ${(data['radius'] * 2 - data['thickness'] * 2)} ` +
			`v ${(data['radius'] * 2 - data['thickness'] * 2)} Z `;

		this.whiteMovements['pin'] = (x, y, c) =>
			`M ${data['xs'] - data['radius'] + data['radius'] - data['pinRadius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['pinRadius']) - data['dy'] * y} ` +
			`h ${data['pinRadius'] * 2} v ${-data['pinRadius'] * 2} h ${-data['pinRadius'] * 2} Z `;
	}
};
