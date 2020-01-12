'use strict';
const movementHash = module.parent.exports.movementHash;
const data = module.parent.exports.data;

// ■を描く操作
const squareMovement = (x, y, c) =>
	`M ${data['xs'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['radius']) - data['dy'] * y} ` +
	`h ${data['radius'] * 2} v ${-data['radius'] * 2} h ${-data['radius'] * 2} v ${+data['radius'] * 2} Z `;

// □を描く操作
const whiteSquareMovement = (x, y, c) =>
	`M ${data['xs'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['radius']) - data['dy'] * y} ` +
	`h ${data['radius'] * 2} v ${-data['radius'] * 2} h ${-data['radius'] * 2} v ${+data['radius'] * 2} ` +
	`m ${data['thickness']},${-data['thickness']}` +
	`v ${-(data['radius'] * 2 - data['thickness'] * 2)} h ${(data['radius'] * 2 - data['thickness'] * 2)} ` +
	`v ${(data['radius'] * 2 - data['thickness'] * 2)} h ${-(data['radius'] * 2 - data['thickness'] * 2)} Z `;

if (data['blackMark'] == 'square') {
	movementHash['black'] = squareMovement;
	if (data['whiteMark'] == 'outline') {
		movementHash['white'] = whiteSquareMovement;
	}
}
