import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const packagejson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default class ShapeSeeker {
    blackMark = "";
    whiteMarks = {};
    static async create(data) {
        const loader = new ShapeSeeker();
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
        this.whiteMarks = {};
        for (const key of Object.keys(plugins)) {
            const module = await import(pathToFileURL(plugins[key]).href);
            const ShapeModule = module.default;
            const shape = new ShapeModule(data);
            this.blackMark = key;
            this.whiteMarks[key] = shape.WhiteMarks;
        }
    }
}
//# sourceMappingURL=shapeseeker.js.map