import { Node, Edge, Graph } from '../../src/index'
import { D3Renderer } from '../../src/renderers/d3'
import { data, large, mediumLg, mediumSm } from '../data'


const graph = new Graph()
const renderer = D3Renderer({ id: 'graph', graph })
graph.onLayout(renderer)

const nodes = mediumSm.nodes.map(({ id }) => ({ id }))

const edges = mediumSm.links.map(({ source, target }) => ({ id: `${source}|${target}`, source, target }))


graph.layout({
  nodes: nodes.reduce<{ [id: string]: Node }>((nodeMap, node) => {
    nodeMap[node.id] = node
    return nodeMap
  }, {}),
  edges: edges.reduce<{ [id: string]: Edge }>((edgeMap, edge) => {
    edgeMap[edge.id] = edge
    return edgeMap
  }, {})
})
