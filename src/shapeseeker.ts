import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type Shape from "./shapes/shape.js"
import type {FontData} from "./fontdata.js";

type ShapeConstructor = new (data: FontData) => Shape;
const packagejson = JSON.parse(
    fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class ShapeSeeker {

    blackMark: string = "";
    whiteMarks: { [key: string]: Array<string> } = {};

    static async create(data: FontData) {
        const loader = new ShapeSeeker();
        await loader.load(data);
        return loader;
    }

    async load(data: FontData) {
        const shapedir = path.join(__dirname, packagejson.config.shapedir);
        const plugins: { [key: string]: string } = {};

        fs.readdirSync(shapedir).forEach((file: string) => {
            const ext = ".js";
            if (path.extname(file) === ext) {
                plugins[file.slice(0, -ext.length)] = path.join(shapedir, file);
            }
        });
        delete plugins.shape;

        this.whiteMarks = {};
        for (const key of Object.keys(plugins)) {

            const module = await import(pathToFileURL(plugins[key] as string).href) as { default: ShapeConstructor };
            const ShapeModule = module.default;
            const shape : Shape  = new ShapeModule(data);

            this.blackMark = key;
            this.whiteMarks[key] = shape.WhiteMarks;
        }
    }
}
