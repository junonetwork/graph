import { select, event } from 'd3-selection'
import { zoom } from 'd3-zoom'
import { drag as dragBehavior } from 'd3-drag'
import raf from 'raf'
import { Graph, Edge, Node, PositionedNode, PositionedEdge } from '../index'
import { DEFAULT_NODE_STYLES, DEFAULT_EDGE_STYLES, Options, DEFAULT_OPTIONS } from './options'
import { interpolateDuration } from '../utils'
import { interpolateNumber, interpolateBasis } from 'd3-interpolate'
import { nodeStyleSelector, edgeStyleSelector } from './utils'


export const D3Renderer = ({
  id,
  tick = DEFAULT_OPTIONS.tick,
  nodeStyles = {},
  edgeStyles = {},
}: Options) => {
  const parent = select<HTMLElement, unknown>(`#${id}`)
  const parentElement = parent.node()
  if (parentElement === null) {
    throw new Error(`Element with id ${id} not found`)
  }

  const svg = parent
    .append('svg')
    .attr('height', '100%')
    .attr('width', '100%')
    .style('cursor', 'move')

  const container = svg.append('g')

  const edgeContainer = container.append('g')

  const nodesContainer = container.append('g')
    
  const zoomBehavior = zoom<SVGSVGElement, unknown>()
  svg.call(zoomBehavior.on('zoom', () => container.attr('transform', event.transform)))
  zoomBehavior.translateBy(svg, parentElement.offsetWidth / 2, parentElement.offsetHeight / 2)

  let draggedNode: string | undefined
  const dragNode = dragBehavior<any, PositionedNode>()
    .on('start', (d) => (draggedNode = d.id, graph.dragStart(d.id, event.x, event.y)))
    .on('drag', (d) => graph.drag(d.id, event.x, event.y))
    .on('end', (d) => (draggedNode = undefined, graph.dragEnd(d.id)))

  const NODE_STYLES = { ...DEFAULT_NODE_STYLES, ...nodeStyles }
  const EDGE_STYLES = { ...DEFAULT_EDGE_STYLES, ...edgeStyles }
  const _nodeWidthSelector = nodeStyleSelector(NODE_STYLES, 'width')
  const nodeWidthSelector = (node: PositionedNode) => _nodeWidthSelector(node) / 2
  const nodeStrokeWidthSelector = nodeStyleSelector(NODE_STYLES, 'strokeWidth')
  const nodeFillSelector = nodeStyleSelector(NODE_STYLES, 'fill')
  const nodeStrokeSelector = nodeStyleSelector(NODE_STYLES, 'stroke')
  const nodeFillOpacitySelector = nodeStyleSelector(NODE_STYLES, 'fillOpacity')
  const nodeStrokeOpacitySelector = nodeStyleSelector(NODE_STYLES, 'strokeOpacity')
  const edgeStrokeSelector = edgeStyleSelector(EDGE_STYLES, 'stroke')
  const edgeWidthSelector = edgeStyleSelector(EDGE_STYLES, 'width')
  const edgeStrokeOpacitySelector = edgeStyleSelector(EDGE_STYLES, 'strokeOpacity')

  // const nodeClickHandler = (d: PositionedNode) => console.log('click', d.id)
  // const nodeMouseEnterHandler = (d: PositionedNode) => console.log('mouseenter', d.id)
  // const nodeMouseLeaveHandler = (d: PositionedNode) => console.log('mouseleave', d.id)

  const interpolateLayout = interpolateDuration(400)
  const synchronousLayout = (cb: (n: number) => void) => raf(() => cb(1))
  const interpolatePosition = (start: number, end: number, percent: number) => {
    const interpolate = interpolateNumber(start, end)
    return interpolateBasis([interpolate(0), interpolate(0.1), interpolate(0.8), interpolate(0.95), interpolate(1)])(percent)
  }

  const graph = new Graph(({ nodes, edges }) => {
    /**
     * interpolation animations are disabled while dragging, which means adding new nodes while dragging is weirdly jerky
     * why does interpolating layout while dragging not really work? should node position interpolation be disabled only for the single node?
     * or should we split selection/rendering between dragged nodes and other nodes
     */
    (draggedNode !== undefined || tick === null ? synchronousLayout : interpolateLayout)((n: number) => {
      nodesContainer
        .selectAll<SVGLineElement, PositionedNode>('circle')
        .data(Object.values(nodes), (d) => d.id)
        .join('circle')
        .attr('cx', (d) => interpolatePosition(d.x0 || 0, d.x!, n))
        .attr('cy', (d) => interpolatePosition(d.y0 || 0, d.y!, n))
        // .attr('cx', (d) => d.id === draggedNode ? d.x! : interpolatePosition(d.x0 || 0, d.x!, n))
        // .attr('cy', (d) => d.id === draggedNode ? d.y! : interpolatePosition(d.y0 || 0, d.y!, n))
        .style('cursor', 'pointer')
        .attr('r', nodeWidthSelector)
        .style('stroke-width', nodeStrokeWidthSelector)
        .style('fill', nodeFillSelector)
        .style('stroke', nodeStrokeSelector)
        .style('fill-opacity', nodeFillOpacitySelector)
        .style('stroke-opacity', nodeStrokeOpacitySelector)
        // .on('click', nodeClickHandler)
        // .on('mouseenter', nodeMouseEnterHandler)
        // .on('mouseleave', nodeMouseLeaveHandler)
        .call(dragNode)

      edgeContainer
        .selectAll<SVGLineElement, PositionedEdge>('line')
        .data(Object.values(edges), (d) => d.id)
        .join('line')
        // .attr('x1', (d) => d.id === draggedNode ? d.source.x! : interpolatePosition(d.source.x0 || 0, d.source.x!, n))
        // .attr('y1', (d) => d.id === draggedNode ? d.source.y! : interpolatePosition(d.source.y0 || 0, d.source.y!, n))
        // .attr('x2', (d) => d.id === draggedNode ? d.target.x! : interpolatePosition(d.target.x0 || 0, d.target.x!, n))
        // .attr('y2', (d) => d.id === draggedNode ? d.target.y! : interpolatePosition(d.target.y0 || 0, d.target.y!, n))
        .attr('x1', (d) => interpolatePosition(d.source.x0 || 0, d.source.x!, n))
        .attr('y1', (d) => interpolatePosition(d.source.y0 || 0, d.source.y!, n))
        .attr('x2', (d) => interpolatePosition(d.target.x0 || 0, d.target.x!, n))
        .attr('y2', (d) => interpolatePosition(d.target.y0 || 0, d.target.y!, n))
        .style('stroke', edgeStrokeSelector)
        .style('stroke-width', edgeWidthSelector)
        .style('stroke-opacity', edgeStrokeOpacitySelector)
    })
  })

  return (nodes: { [key: string]: Node }, edges: { [key: string]: Edge }) => {
    graph.layout({ nodes, edges, options: { tick } })
  }
}