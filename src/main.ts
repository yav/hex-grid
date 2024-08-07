import { Grid } from "./hex-grid.ts"
import { FLoc, ELoc, VLoc } from "./coord.ts"
import { newHexShape, newEdgeShape } from "./shapes.ts"



function getHexDOM(grid: Grid, loc: FLoc): HTMLElement {
  const dom = newHexShape(grid, loc)
  const style = dom.style

 
  style.color = "black"
  style.textAlign = "center"
  dom.textContent = loc.x + ", " + loc.y
  const color = "red"
  style.backgroundColor = color
  dom.addEventListener("mouseenter",() => style.backgroundColor = "blue")
  dom.addEventListener("mouseleave",() => style.backgroundColor = color )
  return dom
}

function getEdge(grid: Grid, loc: ELoc): HTMLElement {
  const dom = newEdgeShape(grid,loc)
  const style = dom.style
  style.position = "absolute"

  style.backgroundColor = "orange"

  style.zIndex = "1"
  dom.setAttribute("title", loc.face.x + ", " + loc.face.y + ", " + loc.number )
  return dom
}



function getVert(grid: Grid, loc: VLoc): HTMLElement {
  const dom = document.createElement("div")
  const style = dom.style
  style.position = "absolute"

  const sz = 2 * Math.sqrt(3) * grid.spacing / 3
  style.width = grid.toUnit(sz)
  style.height = grid.toUnit(sz)
  style.backgroundColor = "black"
  const [x,y] = grid.vertexLoc(loc)

  style.left = grid.toUnit(x - sz/2)
  style.top = grid.toUnit(y - sz/2)
  style.clipPath = "circle(45%)"
  style.zIndex = "2"
  dom.setAttribute("title", loc.face.x + ", " + loc.face.y + ", " + loc.number )
  return dom
}


function main() {
  const grid = new Grid()
  grid.setOrientation("edge_up")  
  grid.setInnerDiameter(64)
  grid.setSpacing(32)

  const app = document.getElementById("app")
  if (app === null) return
  app.style.position = "relative"
  

  let loc = new FLoc()
  function draw() {
    const dom = getHexDOM(grid,loc)
    app?.append(dom)
    let count = 0;
    for (const v of loc.vertices()) {
      if (count > 2) break
      console.log(v)
      const ve = getVert(grid, v)
      app?.append(ve)
      ++count
    }
    count = 0
    for (const e of loc.edges()) {
      if (count > 3) break
      const ve = getEdge(grid, e)
      app?.append(ve)
      ++count
    }
  }
  draw()

  for (const dir of grid.traverseFaces(11,5,true)) {
      loc.advance(dir)
      draw()
  }
  
}

main()
