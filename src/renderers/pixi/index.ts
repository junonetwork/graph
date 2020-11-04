import * as PIXI from 'pixi.js'
import { install } from '@pixi/unsafe-eval'
import { Node, Edge } from '../../'
import { animationFrameLoop } from '../../utils'
import { NodeRenderer } from './node'
import { EdgeRenderer } from './edge'
import { Drag } from './interaction/drag'
import { Decelerate } from './interaction/decelerate'
import { Zoom } from './interaction/zoom'
import { ArrowSprite } from './sprites/arrowSprite'
import { CircleSprite } from './sprites/circleSprite'
import { ImageSprite } from './sprites/ImageSprite'
import { FontIconSprite } from './sprites/FontIconSprite'


install(PIXI)

export type Event = PIXI.InteractionEvent

export type TextIcon = {
  type: 'textIcon'
  family: string
  text: string
  color: string
  size: number
}

export type ImageIcon = {
  type: 'imageIcon'
  url: string
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

export type NodeStyle = {
  color: string
  stroke: Partial<{
    color: string
    width: number
  }>[]
  badge: {
    position: number
    radius?: number
    color?: string
    stroke?: string
    strokeWidth?: number
    icon?: TextIcon | ImageIcon
  }[]
  icon: TextIcon | ImageIcon
  labelFamily: string
  labelColor: string
  labelSize: number
  labelWordWrap: number
  labelBackground: string
}

export type EdgeStyle = {
  width: number
  stroke: string
  strokeOpacity: number
  labelFamily: string
  labelColor: string
  labelSize: number
  labelWordWrap: number
  arrow: 'forward' | 'reverse' | 'both' | 'none'
}

export type RendererOptions<N extends Node = Node, E extends Edge = Edge> = {
  width: number
  height: number
  x: number
  y: number
  zoom: number
  minZoom: number
  maxZoom: number
  nodesEqual: (previous: N[], current: N[]) => boolean
  edgesEqual: (previous: E[], current: E[]) => boolean
  onNodePointerEnter?: (event: Event, node: N, x: number, y: number) => void
  onNodePointerDown?: (event: Event, node: N, x: number, y: number) => void
  onNodeDrag?: (event: Event, node: N, x: number, y: number) => void
  onNodePointerUp?: (event: Event, node: N, x: number, y: number) => void
  onNodePointerLeave?: (event: Event, node: N, x: number, y: number) => void
  onNodeDoubleClick?: (event: Event, node: N, x: number, y: number) => void
  onEdgePointerEnter?: (event: Event, edge: E, x: number, y: number) => void
  onEdgePointerDown?: (event: Event, edge: E, x: number, y: number) => void
  onEdgePointerUp?: (event: Event, edge: E, x: number, y: number) => void
  onEdgePointerLeave?: (event: Event, edge: E, x: number, y: number) => void
  onContainerPointerEnter?: (event: Event, x: number, y: number) => void
  onContainerPointerDown?: (event: Event, x: number, y: number) => void
  onContainerPointerMove?: (event: Event, x: number, y: number) => void
  onContainerDrag?: (event: Event | undefined, x: number, y: number) => void
  onContainerPointerUp?: (event: Event, x: number, y: number) => void
  onContainerPointerLeave?: (event: Event, x: number, y: number) => void
  onWheel?: (e: WheelEvent, x: number, y: number, scale: number) => void
}


export const RENDERER_OPTIONS: RendererOptions<Node, Edge> = {
  width: 800, height: 600, x: 0, y: 0, zoom: 1, minZoom: 0.1, maxZoom: 2.5,
  nodesEqual: () => false, edgesEqual: () => false,
}

const POSITION_ANIMATION_DURATION = 800

PIXI.utils.skipHello()


export class PIXIRenderer<N extends Node, E extends Edge>{

  update: (graph: { nodes: N[], edges: E[], options?: Partial<RendererOptions<N, E>> }) => void

  hoveredNode?: NodeRenderer<N, E>
  clickedNode?: NodeRenderer<N, E>
  hoveredEdge?: EdgeRenderer<N, E>
  clickedEdge?: EdgeRenderer<N, E>
  clickedContainer = false
  cancelAnimationLoop: () => void
  dirty = false
  viewportDirty = false
  previousTime = performance.now()
  animationDuration = 0
  animationPercent = 0
  edgesLayer = new PIXI.Container()
  nodesLayer = new PIXI.Container()
  labelsLayer = new PIXI.Container()
  frontNodeLayer = new PIXI.Container()
  frontLabelLayer = new PIXI.Container()
  edgesGraphic = new PIXI.Graphics()
  nodes: N[] = []
  edges: E[] = []
  nodesById: { [id: string]: NodeRenderer<N, E> } = {}
  edgesById: { [id: string]: EdgeRenderer<N, E> } = {}
  edgeIndex: { [edgeA: string]: { [edgeB: string]: Set<string> } } = {}
  arrow: ArrowSprite<N, E>
  circle: CircleSprite<N, E>
  image: ImageSprite
  fontIcon: FontIconSprite
  zoomInteraction: Zoom<N, E>
  dragInteraction: Drag<N, E>
  decelerateInteraction: Decelerate<N, E>

  onContainerPointerEnter?: (event: Event, x: number, y: number) => void
  onContainerPointerDown?: (event: Event, x: number, y: number) => void
  onContainerDrag?: (event: Event | undefined, x: number, y: number) => void
  onContainerPointerMove?: (event: Event, x: number, y: number) => void
  onContainerPointerUp?: (event: Event, x: number, y: number) => void
  onContainerPointerLeave?: (event: Event, x: number, y: number) => void
  onWheel?: (e: WheelEvent, x: number, y: number, scale: number) => void
  onNodePointerEnter?: (event: Event, node: N, x: number, y: number) => void
  onNodePointerDown?: (event: Event, node: N, x: number, y: number) => void
  onNodeDrag?: (event: Event, node: N, x: number, y: number) => void
  onNodePointerUp?: (event: Event, node: N, x: number, y: number) => void
  onNodePointerLeave?: (event: Event, node: N, x: number, y: number) => void
  onNodeDoubleClick?: (event: Event, node: N, x: number, y: number) => void
  onEdgePointerEnter?: (event: Event, edge: E, x: number, y: number) => void
  onEdgePointerDown?: (event: Event, edge: E, x: number, y: number) => void
  onEdgePointerUp?: (event: Event, edge: E, x: number, y: number) => void
  onEdgePointerLeave?: (event: Event, edge: E, x: number, y: number) => void
  onEdgeDoubleClick?: (event: Event, edge: E, x: number, y: number) => void
  width = RENDERER_OPTIONS.width
  height = RENDERER_OPTIONS.height
  zoom = RENDERER_OPTIONS.zoom
  minZoom = RENDERER_OPTIONS.minZoom
  maxZoom = RENDERER_OPTIONS.maxZoom
  x = RENDERER_OPTIONS.x
  y = RENDERER_OPTIONS.y
  app: PIXI.Application
  root = new PIXI.Container()
  debug?: { logPerformance?: boolean, stats?: Stats }

  constructor({ container, debug }: { container: HTMLDivElement, debug?: { logPerformance?: boolean, stats?: Stats } }) {
    if (!(container instanceof HTMLDivElement)) {
      throw new Error('container must be an instance of HTMLDivElement')
    }

    const view = document.createElement('canvas')
    container.appendChild(view)
    container.style.position = 'relative'

    this.app = new PIXI.Application({
      view,
      width: this.width,
      height: this.height,
      resolution: 2, // window.devicePixelRatio,
      transparent: true,
      antialias: true,
      autoDensity: true,
      autoStart: false,
      powerPreference: 'high-performance',
    })

    this.labelsLayer.interactiveChildren = false
    this.nodesLayer.sortableChildren = true // TODO - perf test

    this.root.pivot.x = this.width / this.zoom / -2
    this.root.pivot.y = this.height / this.zoom / -2
    this.app.stage.addChild(this.root)
    this.root.addChild(this.edgesGraphic)
    this.root.addChild(this.edgesLayer)
    this.root.addChild(this.nodesLayer)
    this.root.addChild(this.labelsLayer)
    this.root.addChild(this.frontNodeLayer)
    this.root.addChild(this.frontLabelLayer)

    this.zoomInteraction = new Zoom(this, (e, x, y, zoom) => this.onWheel?.(e, x, y, zoom))
    this.dragInteraction = new Drag(this, (e, x, y) => this.onContainerDrag?.(e, x, y))
    this.decelerateInteraction = new Decelerate(this, (x, y) => this.onContainerDrag?.(undefined, x, y))

    const pointerEnter = (event: Event) => {
      const { x, y } = this.root.toLocal(event.data.global)
      this.onContainerPointerEnter?.(event, x, y)
    }
    const pointerDown = (event: Event) => {
      this.dragInteraction.down(event)
      this.decelerateInteraction.down()

      if (this.hoveredNode === undefined && this.clickedNode === undefined  && this.hoveredEdge === undefined && this.clickedEdge === undefined) {
        this.clickedContainer = true
        const { x, y } = this.root.toLocal(event.data.global)
        this.onContainerPointerDown?.(event, x, y)
      }
    }
    const pointerMove = (event: Event) => {
      this.dragInteraction.move(event)
      this.decelerateInteraction.move()

      if (this.onContainerPointerMove) {
        const { x, y } = this.root.toLocal(event.data.global)
        this.onContainerPointerMove(event, x, y)
      }
    }
    const pointerUp = (event: Event) => {
      this.dragInteraction.up()
      this.decelerateInteraction.up()

      if (this.clickedContainer) {
        this.clickedContainer = false
        const { x, y } = this.root.toLocal(event.data.global)
        this.onContainerPointerUp?.(event, x, y)
      }
    }
    const pointerLeave = (event: Event) => {
      const { x, y } = this.root.toLocal(event.data.global)
      this.onContainerPointerLeave?.(event, x, y)
    }

    this.app.renderer.plugins.interaction.on('pointerenter', pointerEnter)
    this.app.renderer.plugins.interaction.on('pointerdown', pointerDown)
    this.app.renderer.plugins.interaction.on('pointermove', pointerMove)
    this.app.renderer.plugins.interaction.on('pointerup', pointerUp)
    this.app.renderer.plugins.interaction.on('pointerupoutside', pointerUp)
    this.app.renderer.plugins.interaction.on('pointercancel', pointerUp)
    this.app.renderer.plugins.interaction.on('pointerout', pointerUp)
    this.app.renderer.plugins.interaction.on('pointerleave', pointerLeave)
    this.app.view.addEventListener('wheel', this.zoomInteraction.wheel)

    this.arrow = new ArrowSprite<N, E>(this)
    this.circle = new CircleSprite<N, E>(this)
    this.image = new ImageSprite()
    this.fontIcon = new FontIconSprite()

    this.debug = debug
    if (this.debug) {
      this.cancelAnimationLoop = animationFrameLoop(this.debugRender)
      this.update = this._debugUpdate
    } else {
      this.cancelAnimationLoop = animationFrameLoop(this.render)
      this.update = this._update
    }
  }

  private _update = ({
    nodes,
    edges,
    options: {
      width = RENDERER_OPTIONS.width, height = RENDERER_OPTIONS.height, x = RENDERER_OPTIONS.x, y = RENDERER_OPTIONS.y, zoom = RENDERER_OPTIONS.zoom,
      minZoom = RENDERER_OPTIONS.minZoom, maxZoom = RENDERER_OPTIONS.maxZoom,
      nodesEqual = RENDERER_OPTIONS.nodesEqual, edgesEqual = RENDERER_OPTIONS.edgesEqual,
      onNodePointerEnter, onNodePointerDown, onNodeDrag, onNodePointerUp, onNodePointerLeave, onNodeDoubleClick,
      onEdgePointerEnter, onEdgePointerDown, onEdgePointerUp, onEdgePointerLeave,
      onContainerPointerEnter, onContainerPointerDown, onContainerDrag, onContainerPointerMove, onContainerPointerUp, onContainerPointerLeave, onWheel,
    } = RENDERER_OPTIONS
  }: { nodes: N[], edges: E[], options?: Partial<RendererOptions<N, E>> }) => {
    this.onContainerPointerEnter = onContainerPointerEnter
    this.onContainerPointerDown = onContainerPointerDown
    this.onContainerDrag = onContainerDrag
    this.onContainerPointerMove = onContainerPointerMove
    this.onContainerPointerUp = onContainerPointerUp
    this.onContainerPointerLeave = onContainerPointerLeave
    this.onNodePointerEnter = onNodePointerEnter
    this.onNodePointerDown = onNodePointerDown
    this.onNodeDrag = onNodeDrag
    this.onNodePointerUp = onNodePointerUp
    this.onNodePointerLeave = onNodePointerLeave
    this.onNodeDoubleClick = onNodeDoubleClick
    this.onEdgePointerEnter = onEdgePointerEnter
    this.onEdgePointerDown = onEdgePointerDown
    this.onEdgePointerUp = onEdgePointerUp
    this.onEdgePointerLeave = onEdgePointerLeave
    this.onWheel = onWheel
    this.zoomInteraction.minZoom = minZoom
    this.zoomInteraction.maxZoom = maxZoom

    if (width !== this.width || height !== this.height) {
      this.width = width
      this.height = height
      this.root.pivot.x = this.width / zoom / -2
      this.root.pivot.y = this.height / zoom / -2
      this.app.renderer.resize(this.width, this.height)
      this.viewportDirty = true
    }

    if (x !== this.x) {
      this.x = this.root.x = x
      this.viewportDirty = true
    }

    if (y !== this.y) {
      this.y = this.root.y = y
      this.viewportDirty = true
    }

    if (zoom !== this.zoom) {
      this.zoom = zoom
      this.root.pivot.x = (this.width / zoom) / -2
      this.root.pivot.y = (this.height / zoom) / -2
      this.root.scale.set(zoom) // TODO - interpolate zoom
      this.viewportDirty = true
    }

    const edgesAreEqual = edgesEqual(this.edges, edges)
    const nodesAreEqual = nodesEqual(this.nodes, nodes)


    /**
     * Build edge indices
     */
    if (!edgesAreEqual) {
      for (const edge of edges) {
        if (this.edgeIndex[edge.source] === undefined) {
          this.edgeIndex[edge.source] = {}
        }
        if (this.edgeIndex[edge.target] === undefined) {
          this.edgeIndex[edge.target] = {}
        }
        if (this.edgeIndex[edge.source][edge.target] === undefined) {
          this.edgeIndex[edge.source][edge.target] = new Set()
        }
        if (this.edgeIndex[edge.target][edge.source] === undefined) {
          this.edgeIndex[edge.target][edge.source] = new Set()
        }

        this.edgeIndex[edge.source][edge.target].add(edge.id)
        this.edgeIndex[edge.target][edge.source].add(edge.id)
      }
    }


    /**
     * Ndge enter/update/exit
     */
    if (!nodesAreEqual) {
      this.nodes = nodes

      const nodesById: { [id: string]: NodeRenderer<N, E> } = {}

      for (const node of nodes) {
        if (this.nodesById[node.id] === undefined) {
          // node enter
          let adjacentNode: string | undefined

          if (this.edgeIndex[node.id]) {
            // nodes w edges from existing positioned nodes enter from one of those nodes
            adjacentNode = Object.keys(this.edgeIndex[node.id]).find((adjacentNodeId) => (
              this.nodesById[adjacentNodeId]?.node.x !== undefined && this.nodesById[adjacentNodeId]?.node.y !== undefined
            ))
          }

          nodesById[node.id] = new NodeRenderer(this, node, this.nodesById[adjacentNode ?? '']?.x ?? 0, this.nodesById[adjacentNode ?? '']?.y ?? 0, node.radius)
          /**
           * alternatively, don't animate entering nodes
           */
          // nodesById[node.id] = new NodeRenderer(this, node, this.nodesById[adjacentNode]?.x ?? node.x ?? 0, this.nodesById[adjacentNode]?.y ?? node.y ?? 0, node.radius)
        } else {
          nodesById[node.id] = this.nodesById[node.id].update(node)
        }
      }

      for (const nodeId in this.nodesById) {
        if (nodesById[nodeId] === undefined) {
          // node exit
          this.nodesById[nodeId].delete()
        }
      }

      this.animationDuration = 0
      this.nodesById = nodesById
      this.dirty = true
    }


    /**
     * Edge enter/update/exit
     */
    if (!edgesAreEqual) {
      this.edges = edges

      const edgesById: { [id: string]: EdgeRenderer<N, E> } = {}

      for (const edge of edges) {
        const id = edge.id
        if (this.edgesById[id] === undefined) {
          // edge enter
          edgesById[id] = new EdgeRenderer(this, edge)
        } else {
          // edge update
          edgesById[id] = this.edgesById[id].update(edge)
        }
      }

      for (const edgeId in this.edgesById) {
        if (edgesById[edgeId] === undefined) {
          // edge exit
          this.edgesById[edgeId].delete()
        }
      }

      this.edgesById = edgesById
      this.dirty = true
    }


    return this
  }

  private _debugUpdate = (graph: { nodes: N[], edges: E[], options?: Partial<RendererOptions<N, E>> }) => {
    performance.mark('update')
    this._update(graph)
    performance.measure('update', 'update')
  }

  private render = (time: number) => {
    const elapsedTime = time - this.previousTime
    this.animationDuration += Math.min(20, Math.max(0, elapsedTime)) // clamp to 0 <= x <= 20 to smooth animations
    // this.animationDuration += elapsedTime
    this.animationPercent = Math.min(this.animationDuration / POSITION_ANIMATION_DURATION, 1)
    this.previousTime = time

    this.decelerateInteraction.update(elapsedTime)

    if (this.dirty) {
      for (const nodeId in this.nodesById) {
        this.nodesById[nodeId].render()
      }

      this.edgesGraphic.clear()
      for (const edgeId in this.edgesById) {
        this.edgesById[edgeId].render()
      }

      this.app.render()
      this.dirty = this.animationPercent < 1
    } else if (this.viewportDirty) {
      this.app.render()
      this.viewportDirty = false
    }
  }

  private _debugFirstRender = true
  private debugRender = (time: number) => {
    const elapsedTime = time - this.previousTime
    this.animationDuration += Math.min(20, Math.max(0, elapsedTime))
    // this.animationDuration += elapsedTime
    this.animationPercent = Math.min(this.animationDuration / POSITION_ANIMATION_DURATION, 1)
    this.previousTime = time

    this.decelerateInteraction.update(elapsedTime)

    this.debug?.stats?.update()
    if (!this._debugFirstRender) {
      performance.measure('external', 'external')
    } else {
      this._debugFirstRender = false
    }

    if (this.dirty) {
      performance.mark('render')
      for (const nodeId in this.nodesById) {
        this.nodesById[nodeId].render()
      }

      this.edgesGraphic.clear()
      for (const edgeId in this.edgesById) {
        this.edgesById[edgeId].render()
      }
      performance.measure('render', 'render')

      performance.mark('draw')
      this.app.render()
      performance.measure('draw', 'draw')
    } else if (this.viewportDirty) {
      performance.mark('draw')
      this.app.render()
      performance.measure('draw', 'draw')
    }

    if (this.debug?.logPerformance && (this.dirty || this.viewportDirty)) {
      let external = 0
      let update = 0
      let render = 0
      let draw = 0
      let total = 0
      for (const measurement of performance.getEntriesByType('measure')) {
        if (measurement.name === 'update') {
          update = measurement.duration
          total += measurement.duration
        } else if (measurement.name === 'render') {
          render = measurement.duration
          total += measurement.duration
        } else if (measurement.name === 'draw') {
          draw = measurement.duration
          total += measurement.duration
        } else if (measurement.name === 'external') {
          external = measurement.duration
          total += measurement.duration
        }
      }

      // green: 50+ frames/sec, pink: 30 frames/sec, red: 20 frames/sec
      console.log(
        `%c${total.toFixed(1)}ms%c (update: %c${update.toFixed(1)}%c, render: %c${render.toFixed(1)}%c, draw: %c${draw.toFixed(1)}%c, external: %c${external.toFixed(1)}%c)`,
        `color: ${total <= 20 ? '#6c6' : total <= 33 ? '#f88' : total <= 50 ? '#e22' : '#a00'}`,
        'color: #666',
        `color: ${update <= 5 ? '#6c6' : update <= 10 ? '#f88' : update <= 20 ? '#e22' : '#a00'}`,
        'color: #666',
        `color: ${render <= 5 ? '#6c6' : render <= 10 ? '#f88' : render <= 20 ? '#e22' : '#a00'}`,
        'color: #666',
        `color: ${draw <= 5 ? '#6c6' : draw <= 10 ? '#f88' : draw <= 20 ? '#e22' : '#a00'}`,
        'color: #666',
        `color: ${external <= 5 ? '#6c6' : external <= 10 ? '#f88' : external <= 20 ? '#e22' : '#a00'}`,
        'color: #666',
      )
    }

    this.dirty = this.animationPercent < 1
    this.viewportDirty = false

    performance.clearMarks()
    performance.clearMeasures()
    performance.mark('external')
  }

  delete = () => {
    this.cancelAnimationLoop()
    this.app.destroy(true, { children: true, texture: true, baseTexture: true })
    this.circle.delete()
    this.arrow.delete()
    this.image.delete()
    this.fontIcon.delete()
  }
}


export const Renderer = <N extends Node, E extends Edge>(options: { container: HTMLDivElement, debug?: { logPerformance?: boolean, stats?: Stats } }) => {
  const pixiRenderer = new PIXIRenderer<N, E>(options)

  const render = (graph: { nodes: N[], edges: E[], options?: Partial<RendererOptions<N, E>> }) => {
    pixiRenderer.update(graph)
  }

  render.delete = pixiRenderer.delete

  return render
}
