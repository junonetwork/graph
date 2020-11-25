import * as PIXI from 'pixi.js-legacy';
import { InternalRenderer } from '..';
import { Node, Edge } from '../../..';
export declare class CircleSprite<N extends Node, E extends Edge> {
    static radius: number;
    private texture;
    constructor(renderer: InternalRenderer<N, E>);
    create(): PIXI.Sprite;
    delete(): void;
}
/**
 * TODO - generate circle sprites on the fly scaled to the max scale they can be rendered at
 */
