import { color } from 'd3-color'
import { Renderer } from '.'
import { NodeContainer } from './nodeContainer'


export const colorToNumber = (colorString: string): number => {
  const c = color(colorString)
  if (c === null) {
    return 0x000000
  }

  return parseInt(c.hex().slice(1), 16)
}


export const parentInFront = (renderer: Renderer, parent: NodeContainer | undefined) => {
  while (parent) {
    if (renderer.hoveredNode === parent) {
      return true
    }
    parent = parent.parent
  }

  return false
}
