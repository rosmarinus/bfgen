import type { FontData } from "./fontdata.js";
export default class ShapeSeeker {
    blackMark: string;
    whiteMarks: {
        [key: string]: Array<string>;
    };
    static create(data: FontData): Promise<ShapeSeeker>;
    load(data: FontData): Promise<void>;
}
//# sourceMappingURL=shapeseeker.d.ts.map