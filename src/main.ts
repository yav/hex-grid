import { Grid } from "./hex-grid.ts"
import { FLoc, ELoc, VLoc } from "./coord.ts"



function getHexDOM(grid: Grid, loc: FLoc): HTMLElement {
  const dom = document.createElement("div")
  const style = dom.style
  style.position = "absolute"
 
  const vup = grid.orientation === "vertex_up"
  const w = vup? grid.inner_diameter : grid.outer_diameter
  const h = vup? grid.outer_diameter : grid.inner_diameter

  style.width = grid.toUnit(w)
  style.height = grid.toUnit(h)

  style.clipPath = vup
                 ? "polygon(0 25%, 50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%)"
                 : "polygon(0 50%, 25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%)"
  const [l,t] = grid.faceLoc(loc)
  style.left = grid.toUnit(l - w/2)
  style.top = grid.toUnit(t - h/2)
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
  const dom = document.createElement("div")
  const style = dom.style
  style.position = "absolute"

  const sz = grid.spacing
  style.width = grid.toUnit(sz)
  style.height = grid.toUnit(sz)
  style.backgroundColor = "orange"
  const [x,y] = grid.edgeLoc(loc)

  style.left = grid.toUnit(x - sz/2)
  style.top = grid.toUnit(y - sz/2)
  style.clipPath = "circle(30%)"
  style.zIndex = "2"
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
  grid.setOrientation("vertex_up")  
  grid.setInnerDiameter(64)
  grid.setSpacing(10)

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
