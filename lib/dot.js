'use strict';
const movementHash = module.parent.exports.movementHash;
const data = module.parent.exports.data;

// ●を描く操作
const dotMovement = (x, y, c) =>
	`M ${data['xs'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] - data['dy'] * y} ` +
	`a ${data['radius']},${data['radius']} 0,1,0 ${data['radius'] * 2},0 ` +
	`a ${data['radius']},${data['radius']} 0,1,0 ${-data['radius'] * 2},0 Z `;

// 空点を描く操作
const pinMovement = (x, y, c) =>
	`M ${data['xs'] + data['radius'] - data['pinRadius'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] - data['dy'] * y} ` +
	`a ${data['pinRadius']},${data['pinRadius']} 0,1,0 ${data['pinRadius'] * 2},0 ` +
	`a ${data['pinRadius']},${data['pinRadius']} 0,1,0 ${-data['pinRadius'] * 2},0 Z `;

// 空線を描く操作
const dashMovement = (x, y, c) =>
	`M ${data['xs'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] + (data['thickness'] / 2) - data['dy'] * y} ` +
	`h ${data['radius'] * 2} v ${-data['thickness']} h ${-data['radius'] * 2} v ${+data['thickness']} Z `;

// ○を描く操作
const outlineMovement = (x, y, c) =>
	`M ${data['xs'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] - data['dy'] * y} ` +
	`a ${data['radius']},${data['radius']} 0,1,0 ${data['radius'] * 2},0 ` +
	`a ${data['radius']},${data['radius']} 0,1,0 ${-data['radius'] * 2},0 ` +
	`m ${data['thickness']},0 ` +
	`a ${data['radius'] - data['thickness']},${data['radius'] - data['thickness']} 0,1,1 ${(data['radius'] - data['thickness']) * 2},0 ` +
	`a ${data['radius'] - data['thickness']},${data['radius'] - data['thickness']} 0,1,1 ${-(data['radius'] - data['thickness']) * 2},0 Z `;

movementHash['black'] = dotMovement;
movementHash['white'] =
	data['whiteMark'] == 'pin' ? pinMovement :
	data['whiteMark'] == 'dash' ? dashMovement :
	data['whiteMark'] == 'outline' ? outlineMovement :
	movementHash['white'];
