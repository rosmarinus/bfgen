import type { Movement } from "./shapes/shape.js";
import type { FontData } from "./fontdata.js";
export default class ShapeLoader {
    name: string;
    whiteMovement: Movement;
    blackMovement: Movement;
    static create(data: FontData): Promise<ShapeLoader>;
    load(data: FontData): Promise<void>;
}
//# sourceMappingURL=shapeloader.d.ts.map