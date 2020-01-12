const movementHash = module.parent.exports.movementHash;
const data = module.parent.exports.data;

// ◆を描く操作
const diamondMovement = (x, y, c) =>
	`M ${data['xs'] + data['dx'] * x + c * data['horizAdvX']},${data['ys'] - data['dy'] * y} ` +
	`l ${data['radius']}, ${data['radius']} l ${data['radius']}, ${-data['radius']} ` +
	`l ${-data['radius']}, ${-data['radius']} l ${-data['radius']}, ${data['radius']} Z `;

// ◇を描く操作
const whiteDiamondMovement = (x, y, c) =>
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

if (data['blackMark']=='diamond') {
    movementHash['black'] = diamondMovement;
    if (data['whiteMark'] =='outline') {
        movementHash['white'] = whiteDiamondMovement;
    }
}