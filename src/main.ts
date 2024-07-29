import { Grid, Hex } from "./hex-grid"

function main() {
  const grid = new Grid<number>("vertex_up")
  const hex = grid.getHex()
  hex.setRadius(64)
  hex.setEdge(2)
  const app = document.getElementById("app")
  if (app === null) return
  app.style.position = "relative"
  

  let loc = grid.origin
  function draw() {
    const dom = hex.getDOM(loc)
    app?.append(dom)
  }
  draw()
  for (const dir of grid.traverse_rectangle(11,10,true)) {
      loc = grid.advance(loc,dir,1)
      draw()
  }
  
}

main()