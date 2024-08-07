import { Grid } from "./hex-grid.ts"
import { FLoc, ELoc } from "./coord.ts"

export function newHexShape(grid: Grid, loc: FLoc): HTMLElement {
    const dom = document.createElement("div")
    const style = dom.style
    style.position = "absolute"

    const [w,h] = grid.faceBoundingBox()

    style.width = grid.toUnit(w)
    style.height = grid.toUnit(h)
  
    style.clipPath = grid.isVertexUp()
                   ? "polygon(0 25%, 50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%)"
                   : "polygon(0 50%, 25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%)"
    const [l,t] = grid.faceLoc(loc)
    style.left = grid.toUnit(l - w/2)
    style.top = grid.toUnit(t - h/2)

    return dom
  }

export function newEdgeShape(grid: Grid, loc: ELoc): HTMLElement {
    const dom = document.createElement("div")
    const style = dom.style
    style.position = "absolute"

    const [w,h] = grid.edgeBoundingBox()
    style.width = grid.toUnit(w)
    style.height = grid.toUnit(h)
    const p1 = 100 * (h - grid.outer_diameter/2) / (2 * h)
    const p2 = 100 - p1
    const pp1 = p1 + "%"
    const pp2 = p2 + "%"

    style.clipPath = "polygon(0 " + pp1 + ", 50% 0, 100% " + pp1 + ", 100% " +
                             pp2 + ", 50% 100%, 0 " + pp2 + ")"
                   
    const [l,t] = grid.edgeLoc(loc)
    style.left = grid.toUnit(l - w/2)
    style.top = grid.toUnit(t - h/2)
    const deg = (loc.number * 60) + (grid.isVertexUp() ? 0 : 90)
    style.transform = "rotate(" + deg + "deg)"
    return dom
}