import { Grid } from "./hex-grid.ts"
import { FLoc, ELoc, VLoc, Dir } from "./coord.ts"
import { newHexShape, newEdgeShape, newVertexShapeCirc } from "./shapes.ts"

function blueOnHover(dom: HTMLElement) {
  const style = dom.style
  let color = style.backgroundColor
  dom.addEventListener("mouseenter",() => { color = style.backgroundColor; style.backgroundColor = "blue" })
  dom.addEventListener("mouseleave",() => style.backgroundColor = color )
}

function getHexDOM(grid: Grid, loc: FLoc): HTMLElement {
  const dom = newHexShape(grid, loc)
  const style = dom.style
  style.color = "black"
  style.textAlign = "center"
  dom.textContent = loc.x + ", " + loc.y
  style.backgroundColor = "red"
  blueOnHover(dom)
  return dom
}

function getEdge(grid: Grid, loc: ELoc): HTMLElement {
  const dom = newEdgeShape(grid,loc)
  const style = dom.style
  style.backgroundColor = "orange"
  style.zIndex = "1"
  dom.setAttribute("title", loc.face_loc.x + ", " + loc.face_loc.y + ", " + loc.number )
  blueOnHover(dom)
  return dom
}

function getVert(grid: Grid, loc: VLoc): HTMLElement {
  const dom = newVertexShapeCirc(grid, loc)
  const style = dom.style
  style.backgroundColor = "black"
  style.zIndex = "2"
  dom.setAttribute("title", loc.face_loc.x + ", " + loc.face_loc.y + ", " + loc.number )
  blueOnHover(dom)
  return dom
}


function main() {
  const grid = new Grid()
  grid.setOrientation("edge_up")  
  grid.setInnerDiameter(64)
  grid.setSpacing(16)

  const app1 = document.getElementById("app")
  if (app1 === null) return
  const app = app1
  app.style.position = "relative"
  

  let loc = new FLoc()
  function draw() {
    const dom = getHexDOM(grid,loc)
    app.append(dom)
    let count = 0;
    for (const v of loc.vertices()) {
      if (count > 2) break
      const ve = getVert(grid, v)
      ve.style.backgroundColor = ["black","grey"][v.number]
      app.append(ve)
      ++count
    }
    count = 0
    for (const e of loc.edges()) {
      if (count > 3) break
      const ve = getEdge(grid, e)
      ve.style.backgroundColor = ["orange","pink","cyan"][e.number]
      app.append(ve)
      ++count
    }
  }
  draw()

  for (const dir of grid.traverseFaces(5,10,true)) {
      loc.advance(dir)
      draw()
  }
  
}

main()
