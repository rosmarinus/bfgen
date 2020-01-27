'use strict';
const Shape = require('./shape');
module.exports = class Dot extends Shape {

	constructor(data) {
		super(data);

		// ●を描く
		this.blackMovement = (x, y, c) =>
			`M ${data['xs'] - data['radius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] - data['dy'] * y} ` +
			`a ${data['radius']},${data['radius']} 0,1,0 ${data['radius'] * 2},0 ` +
			`a ${data['radius']},${data['radius']} 0,1,0 ${-data['radius'] * 2},0 Z `;

		const marks = {};
		marks['outline'] = (x, y, c) =>
			`M ${data['xs'] - data['radius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] - data['dy'] * y} ` +
			`a ${data['radius']},${data['radius']} 0,1,0 ${data['radius'] * 2},0 ` +
			`a ${data['radius']},${data['radius']} 0,1,0 ${-data['radius'] * 2},0 Z ` +
			`m ${data['thickness']},0 ` +
			`a ${data['radius'] - data['thickness']},${data['radius'] - data['thickness']} 0,1,1 ${(data['radius'] - data['thickness']) * 2},0 ` +
			`a ${data['radius'] - data['thickness']},${data['radius'] - data['thickness']} 0,1,1 ${-(data['radius'] - data['thickness']) * 2},0 Z `;

		if (data['whiteMark'] in marks) {
			this.whiteMovement = marks[data['whiteMark']];
		}

		Object.keys(marks).forEach(key => {
			if (this.whiteMark.indexOf(key) == -1) {
				this.whiteMark.push(key);
			}
		});
	}
};