import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const packagejson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default class ShapeLoader {
    name = "";
    whiteMovement = (x, y, c) => "";
    blackMovement = (x, y, c) => "";
    static async create(data) {
        const loader = new ShapeLoader();
        await loader.load(data);
        return loader;
    }
    async load(data) {
        const shapedir = path.join(__dirname, packagejson.config.shapedir);
        const plugins = {};
        fs.readdirSync(shapedir).forEach((file) => {
            const ext = ".js";
            if (path.extname(file) === ext) {
                plugins[file.slice(0, -ext.length)] = path.join(shapedir, file);
            }
        });
        // 基底クラスファイルの除外
        delete plugins.shape;
        this.name = data.blackMark;
        if (!Object.hasOwn(plugins, this.name)) {
            throw new Error("unknown blackMark shape: %s");
        }
        const module = await import(pathToFileURL(plugins[this.name]).href);
        const ShapeModule = module.default;
        const shape = new ShapeModule(data);
        if (data.whiteMark !== "empty" && !Object.hasOwn(shape.WhiteMovements, data.whiteMark)) {
            throw new Error("unknown whiteMark shape: %s");
        }
        this.blackMovement = shape.BlackMovement;
        this.whiteMovement = Object.hasOwn(shape.WhiteMovements, data.whiteMark)
            ? shape.WhiteMovements[data.whiteMark] ?? shape.emptyMovement
            : shape.emptyMovement;
    }
}
//# sourceMappingURL=shapeloader.js.map