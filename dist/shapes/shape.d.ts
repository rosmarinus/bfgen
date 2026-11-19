import type { FontData } from "../fontdata.js";
export type Movement = (x: number, y: number, c: number) => string;
export default class Shape {
    emptyMovement: Movement;
    blackMovement: Movement;
    whiteMovements: {
        [key: string]: Movement;
    };
    constructor(data: FontData);
    get BlackMovement(): Movement;
    get WhiteMovements(): {
        [key: string]: Movement;
    };
    get WhiteMarks(): Array<string>;
}
//# sourceMappingURL=shape.d.ts.map