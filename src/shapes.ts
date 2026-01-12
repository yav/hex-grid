import { Grid } from "./hex-grid.ts"
import { FLoc, ELoc, VLoc } from "./coord.ts"

export function newHexShape(grid: Grid, loc: FLoc): HTMLElement {
    const dom = document.createElement("div")
    const style = dom.style
    style.position = "absolute"

    const [l,t] = grid.faceLoc(loc)
    style.left = grid.toUnit(l)
    style.top = grid.toUnit(t)

    const [w,h] = grid.faceBoundingBox()
    style.width = grid.toUnit(w+1)
    style.height = grid.toUnit(h+1)
  
    style.clipPath = grid.isVertexUp()
                   ? "polygon(0 25%, 50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%)"
                   : "polygon(0 50%, 25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%)"
    
    style.transform = "translate(-50%,-50%)"

    return dom
  }

// Edges are shaped like a squished hexagon, so that they completely fill up
// the space between hexagons (so vertices should be drawn on top).
export function newEdgeShape(grid: Grid, loc: ELoc): HTMLElement {
    const dom = document.createElement("div")
    const style = dom.style
    style.position = "absolute"

    const [w,h] = grid.edgeBoundingBox()
    style.width = grid.toUnit(w+1)
    style.height = grid.toUnit(h+1)

    const [l,t] = grid.edgeLoc(loc)
    style.left = grid.toUnit(l)
    style.top = grid.toUnit(t)

    const p1 = 100 * (h - grid.outer_diameter/2) / (2 * h)
    const p2 = 100 - p1
    const pp1 = p1 + "%"
    const pp2 = p2 + "%"

    style.clipPath = "polygon(0 " + pp1 + ", 50% 0, 100% " + pp1 +
                        ", 100% " + pp2 + ", 50% 100%, 0 " + pp2 + ")"
                   
    const deg = (loc.number * 60) + (grid.isVertexUp() ? 0 : 90)
    style.transform = "translate(-50%, -50%) rotate(" + deg + "deg)"
    return dom
}


// A circle on the vertex of a hexagon.
// Its diameter is the space between faces.
export function newVertexShapeCirc(grid: Grid, loc: VLoc): HTMLElement {
  const dom = document.createElement("div")
  const style = dom.style
  style.position = "absolute"

  const [w,h] = grid.vertexBoundingBox()
  style.width = grid.toUnit(w)
  style.height = grid.toUnit(h)

  const [x,y] = grid.vertexLoc(loc)
  style.left = grid.toUnit(x)
  style.top = grid.toUnit(y)
  
  style.clipPath = "circle(50%)"
  style.transform = "translate(-50%,-50%)"

  return dom
}
