import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type Shape from "./shapes/shape.js";
import type { Movement } from "./shapes/shape.js";
import type { FontData } from "./fontdata.js";

type ShapeConstructor = new (data: FontData) => Shape;
const packagejson = JSON.parse(
    fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class ShapeLoader {

    name: string = "";
    whiteMovement: Movement = (x, y, c) => "";
    blackMovement: Movement = (x, y, c) => "";

    static async create(data: FontData) {
        const loader = new ShapeLoader();
        await loader.load(data);
        return loader;
    }

    async load(data: FontData) {
        const shapedir = path.join(__dirname, packagejson.config.shapedir);
        const plugins: { [key: string]: string } = {};

        fs.readdirSync(shapedir).forEach((file) => {
            const ext = ".js";
            if (path.extname(file) === ext) {
                plugins[file.slice(0, -ext.length)] = path.join(shapedir, file);
            }
        });
        delete plugins.shape;

        this.name = data.blackMark;

        if (!Object.hasOwn(plugins, this.name)) {
            throw new Error("unknown blackMark shape: %s");
        }

        const module = await import(pathToFileURL(plugins[this.name] as string).href) as { default: ShapeConstructor };
        const ShapeModule = module.default;

        const shape: Shape = new ShapeModule(data);
        if (data.whiteMark !== "empty" && !Object.hasOwn(shape.WhiteMovements, data.whiteMark)) {
            throw new Error("unknown whiteMark shape: %s");
        }
        this.blackMovement = shape.BlackMovement;
        this.whiteMovement = Object.hasOwn(shape.WhiteMovements, data.whiteMark)
            ? shape.WhiteMovements[data.whiteMark] ?? shape.emptyMovement
            : shape.emptyMovement;
    }
}
