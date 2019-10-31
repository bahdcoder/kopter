"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var Kopter_1 = require("@/Kopter");
test('It initialises a new instance correctly', function () {
    var kopter = new Kopter_1.Kopter(express_1.default());
    expect(kopter.app).toBeDefined();
});
test('It returns the app when init function is called', function () {
    var kopter = new Kopter_1.Kopter(express_1.default());
    expect(kopter.init()).toBe(kopter.app);
});
