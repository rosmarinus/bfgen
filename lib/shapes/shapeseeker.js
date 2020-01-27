'use strict';
module.exports = class ShapeSeeker {

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

        this.whiteMarks = {};
        Object.keys(plugins).forEach(key => {
            const Inner = require(plugins[key]);
            const inner = new Inner(data);
            this.blackMark = key;
            this.whiteMarks[key] = inner.whiteMark;
        });
    };
}
