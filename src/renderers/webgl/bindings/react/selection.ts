import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ViewportDragDecelerateEvent, ViewportDragEvent } from '../..'
import { Annotation, Node } from '../../../..'


export type SelectionChangeEvent = { type: 'selectionChange', selection: Set<string>, altKey: boolean, ctrlKey: boolean, metaKey: boolean, shiftKey: boolean }

export type Props<N extends Node> = {
  nodes: N[]
  color?: string
  strokeColor?: string
  strokeWidth?: number
  shape?: 'rectangle' | 'circle'
  enableOnShift?: boolean
  onSelection?: ((event: SelectionChangeEvent) => void) | undefined
  onViewportDragStart?: ((event: ViewportDragEvent) => void) | undefined
  onViewportDrag?: ((event: ViewportDragEvent | ViewportDragDecelerateEvent) => void) | undefined
  onViewportDragEnd?: ((event: ViewportDragEvent | ViewportDragDecelerateEvent) => void) | undefined
  children: (childProps: ChildProps) => ReactNode
}

export type ChildProps = {
  select: boolean
  annotation?: Annotation
  cursor?: string
  toggleSelect: () => void
  onViewportDragStart: (event: ViewportDragEvent) => void
  onViewportDrag: (event: ViewportDragEvent | ViewportDragDecelerateEvent) => void
  onViewportDragEnd: (event: ViewportDragEvent | ViewportDragDecelerateEvent) => void
}


function setsAreEqual<T>(a: Set<T>, b: Set<T>) {
  if (a.size !== b.size) {
    return false
  }

  for (const item of Array.from(a)) {
    if (!b.has(item)) {
      return false
    }
  }

  return true
}


export const Selection = <N extends Node>(props: Props<N>) => {

  const [state, setState] = useState<{
    select: boolean
    cursor?: string
    annotation?: { type: 'rectangle', x: number, y: number, width: number, height: number }
      | { type: 'circle', x: number, y: number, radius: number }
  }>({ select: false })
  const _state = useRef(state)
  _state.current = state

  const _keys = useRef<{ altKey?: boolean, ctrlKey?: boolean, metaKey?: boolean, shiftKey?: boolean }>({})

  const _selection = useRef<Set<string>>(new Set())

  const _props = useRef<Props<N>>(props)
  _props.current = props

  useEffect(() => {
    const onKeyDown = ({ altKey, ctrlKey, metaKey, shiftKey }: KeyboardEvent) => {
      _keys.current = { altKey, ctrlKey, metaKey, shiftKey }
      if (_props.current.enableOnShift !== false) {
        setState((state) => ({ ...state, select: true }))
      }
    }
    const onKeyUp = () => {
      _keys.current = {}
      setState((state) => ({ ...state, select: false }))
    }

    document.body.addEventListener('keydown', onKeyDown)
    document.body.addEventListener('keyup', onKeyUp)

    return () => {
      document.body.removeEventListener('keydown', onKeyDown)
      document.body.removeEventListener('keyup', onKeyUp)
    }
  })

  const toggleSelect = useCallback(() => setState((state) => ({ ...state, select: !state.select })), [])

  const onViewportDragStart = useCallback((event: ViewportDragEvent) => {
    if (_state.current.select) {
      setState({
        select: true,
        cursor: 'copy',
        annotation: _props.current.shape === 'circle' ?
          { type: 'circle', x: event.x, y: event.y, radius: 0 } :
          { type: 'rectangle', x: event.x, y: event.y, width: 0, height: 0 },
      })
    }

    props.onViewportDragStart?.(event)
  }, [props.onViewportDragStart])

  const onViewportDrag = useCallback((event: ViewportDragEvent | ViewportDragDecelerateEvent) => {
    if (_state.current.select && _state.current.annotation && event.type === 'viewportDrag') {
      const selection = new Set<string>()

      if (_props.current.shape === 'circle') {
        const x = _state.current.annotation.x
        const y = _state.current.annotation.y
        const radius = Math.hypot(event.x - x, event.y - y)

        setState({
          select: true,
          cursor: 'copy',
          annotation: { type: 'circle', x, y, radius },
        })

        for (const node of _props.current.nodes ?? []) {
          if (Math.hypot((node.x ?? 0) - x, (node.y ?? 0) - y) <= radius) {
            selection.add(node.id)
          }
        }
      } else {
        // TODO
      }

      if (!setsAreEqual(_selection.current, selection)) {
        _selection.current = selection

        props.onSelection?.({
          type: 'selectionChange',
          selection,
          altKey: _keys.current.altKey ?? false,
          ctrlKey: _keys.current.ctrlKey ?? false,
          metaKey: _keys.current.metaKey ?? false,
          shiftKey: _keys.current.shiftKey ?? false,
        })
      }
    } else {
      props.onViewportDrag?.(event)
    }
  }, [props.onSelection, props.onViewportDrag])

  const onViewportDragEnd = useCallback((event: ViewportDragEvent | ViewportDragDecelerateEvent) => {
    setState({ select: false })
    props.onViewportDragEnd?.(event)
  }, [props.onViewportDragEnd])


  return props.children({
    select: state.select,
    toggleSelect,
    onViewportDragStart,
    onViewportDrag,
    onViewportDragEnd,
    cursor: state.cursor,
    annotation: state.annotation?.type === 'circle' ? {
      type: 'circle',
      id: 'selection',
      x: state.annotation.x,
      y: state.annotation.y,
      radius: state.annotation.radius,
      style: {
        color: props.color ?? '#eee',
        stroke: {
          color: props.strokeColor ?? '#ccc',
          width: props.strokeWidth ?? 2
        }
      }
    } : state.annotation?.type === 'rectangle' ? {
      type: 'rectangle',
      id: 'selection',
      x: state.annotation.x,
      y: state.annotation.y,
      width: state.annotation.width,
      height: state.annotation.height,
      style: {
        color: props.color ?? '#eee',
        stroke: {
          color: props.strokeColor ?? '#ccc',
          width: props.strokeWidth ?? 2
        }
      }
    } : undefined,
  }) as unknown as JSX.Element
}
