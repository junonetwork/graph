import * as Hierarchy from '../hierarchy'
import { Node, Edge } from '../../'


export type Options = Partial<{
  x: number
  y: number
  radius: number
  bfs: boolean
}>

const TWO_PI = Math.PI * 2


export const Layout = <N extends Node<E>, E extends Edge>() => {
  const layout = Hierarchy.Layout()

  return (root: string, graph: { nodes: N[], edges: E[], options?: Options }) => {
    const { nodes, edges } = layout(
      root,
      {
        nodes: graph.nodes,
        edges: graph.edges,
        options: {
          bfs: graph.options?.bfs,
          size: [TWO_PI, graph.options?.radius ?? 600],
          separation: (a, b) => (a.parent == b.parent ? 1 : 2) / a.depth
        }
      }
    )

    return {
      nodes: nodes.map((node) => {
        const theta = node.x ?? 0
        const radius = node.y ?? 0

        return {
          ...node,
          x: Math.cos(theta) * radius + (graph.options?.x ?? 0),
          y: Math.sin(theta) * radius - (graph.options?.y ?? 0),
        }
      }),
      edges,
      options: graph.options
    }
  }
}
