import { FunctionComponent, ReactNode } from 'react';
import { ViewportDragDecelerateEvent, ViewportDragEvent, ViewportPointerEvent } from '../..';
import { Annotation } from '../../../..';
export declare type SelectionChangeEvent = {
    type: 'selectionChange';
    x: number;
    y: number;
    radius: number;
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
};
export declare type Props = {
    onSelection?: ((event: SelectionChangeEvent) => void) | undefined;
    onViewportPointerDown?: ((event: ViewportPointerEvent) => void) | undefined;
    onViewportDrag?: ((event: ViewportDragEvent | ViewportDragDecelerateEvent) => void) | undefined;
    onViewportDragEnd?: ((event: ViewportDragEvent | ViewportDragDecelerateEvent) => void) | undefined;
    children: (childProps: ChildProps) => ReactNode;
    color?: string;
    strokeColor?: string;
    strokeWidth?: number;
};
export declare type ChildProps = {
    select: boolean;
    annotation?: Annotation;
    cursor?: string;
    toggleSelect: () => void;
    onViewportPointerDown: (event: ViewportPointerEvent) => void;
    onViewportDrag: (event: ViewportDragEvent | ViewportDragDecelerateEvent) => void;
    onViewportDragEnd: (event: ViewportDragEvent | ViewportDragDecelerateEvent) => void;
};
export declare const Selection: FunctionComponent<Props>;