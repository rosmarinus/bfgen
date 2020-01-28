'use strict';
module.exports = class ShapeLoader {

    constructor(data) {
        const fs = require('fs');
        const path = require('path');

        const plugins = {};
        fs.readdirSync(__dirname).forEach(file => {
            if (path.extname(file) === '.js') {
                plugins[file.slice(0, -3)] = path.join(__dirname, file);
            }
        });
        delete plugins['shapeloader'];
        delete plugins['shapeseeker'];
        delete plugins['shape'];

        this.name = data['blackMark'];
        if (plugins[this.name] === undefined) {
            console.error('黒点が未知の図形です:', this.name);
            process.exit(-1);
        }

        const Shape = require(plugins[this.name]);
        const shape = new Shape(data);
        this.blackMovement = shape.BlackMovement;
        this.whiteMovement =
            data['whiteMark'] in shape.WhiteMovements ?
                shape.WhiteMovements[data['whiteMark']] : shape.emptyMovement;
    };
}
