import { InternalRenderer } from '.';
import { NodeRenderer } from './node';
import { Node, Edge } from '../..';
export declare const colorToNumber: (colorString: string) => number;
export declare const parentInFront: <N extends Node, E extends Edge>(renderer: InternalRenderer<N, E>, parent: NodeRenderer<N, E> | undefined) => boolean;
export declare const movePoint: (x: number, y: number, angle: number, distance: number) => [number, number];
export declare const midPoint: (x0: number, y0: number, x1: number, y1: number) => [number, number];
export declare const length: (x0: number, y0: number, x1: number, y1: number) => number;
export declare const angle: (x0: number, y0: number, x1: number, y1: number) => number;
export declare const clientPositionFromEvent: (event: MouseEvent | TouchEvent | PointerEvent) => {
    x: number;
    y: number;
};
export declare const pointerKeysFromEvent: (event: MouseEvent | TouchEvent | PointerEvent) => {
    altKey?: undefined;
    ctrlKey?: undefined;
    metaKey?: undefined;
    shiftKey?: undefined;
} | {
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
};
export declare const HALF_PI: number;
export declare const TWO_PI: number;
export declare const THREE_HALF_PI: number;
export declare const RADIANS_PER_DEGREE: number;
