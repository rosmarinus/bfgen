import Shape from "./shape.js";
import type { FontData } from "../fontdata.js";

export default class Diamond extends Shape {
	constructor(data: FontData) {
		super(data);

		// ◆を描く
		this.blackMovement = (x, y, c) =>
			`M ${data.xs - data.radius + data.dx * x +
			c * (data.horizAdvX as number)
			},${data.ys - data.dy * y} ` +
			`l ${data.radius}, ${data.radius} l ${data.radius}, ${-data
				.radius} ` +
			`l ${-data.radius}, ${-data.radius} Z `;

		this.whiteMovements["outline"] = (x, y, c) =>
			`M ${data.xs - data.radius + data.dx * x +
			c * (data.horizAdvX as number)
			},${data.ys - data.dy * y} ` +
			`l ${data.radius}, ${data.radius} ` +
			`l ${data.radius}, ${-data.radius} ` +
			`l ${-data.radius}, ${-data.radius} Z ` +
			`m ${data.thickness},0 ` +
			`l ${(data.radius - data.thickness)}, ${-(data.radius -
				data.thickness)}` +
			`l ${(data.radius - data.thickness)}, ${(data.radius -
				data.thickness)} ` +
			`l ${-(data.radius - data.thickness)}, ${(data.radius -
				data.thickness)} Z `;
	}
}
