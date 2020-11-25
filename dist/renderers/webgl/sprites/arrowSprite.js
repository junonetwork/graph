"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrowSprite = void 0;
var PIXI = __importStar(require("pixi.js-legacy"));
var ArrowSprite = /** @class */ (function () {
    function ArrowSprite(renderer) {
        this.texture = renderer.app.renderer.generateTexture(new PIXI.Graphics()
            .beginFill(0xffffff)
            .lineTo(ArrowSprite.ARROW_HEIGHT * 2, ArrowSprite.ARROW_WIDTH)
            .lineTo(ArrowSprite.ARROW_HEIGHT * 2, -ArrowSprite.ARROW_WIDTH), PIXI.SCALE_MODES.LINEAR, 2);
    }
    ArrowSprite.prototype.create = function () {
        var sprite = new PIXI.Sprite(this.texture);
        sprite.anchor.set(0, 0.5);
        sprite.scale.set(0.5);
        return sprite;
    };
    ArrowSprite.prototype.delete = function () {
        this.texture.destroy();
    };
    ArrowSprite.ARROW_HEIGHT = 12;
    ArrowSprite.ARROW_WIDTH = 6;
    return ArrowSprite;
}());
exports.ArrowSprite = ArrowSprite;
//# sourceMappingURL=arrowSprite.js.map