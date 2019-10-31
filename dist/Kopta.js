"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Kopter = /** @class */ (function () {
    function Kopter(app) {
        this.app = app;
    }
    /**
     *
     * Initialize the express application
     *
     * @return Express.Application
     */
    Kopter.prototype.init = function () {
        return this.app;
    };
    return Kopter;
}());
exports.Kopter = Kopter;
