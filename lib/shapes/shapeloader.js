'use strict';
module.exports = class Shape {

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
        delete plugins['shape'];

        this.name = data['blackMark'];
        if (plugins[this.name] === undefined) {
            console.error('黒点が未知の図形です:', this.name);
            process.exit(-1);
        }

        const Inner = require(plugins[this.name]);
        const inner = new Inner(data);
        this.blackMovement = inner.blackMovement;
        this.whiteMovement = inner.whiteMovement;
    };
}
