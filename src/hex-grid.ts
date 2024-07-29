export type Dir             = number
export type Orientation     = "vertex_up" | "edge_up"
export type Loc             = [number, number]


const neighbourTable = [ [1, 0], [0, 1], [-1, 1], [-1, 0], [0,-1], [1,-1] ]


const vertexUp: { [name: string]: Dir } = 
  { "E":  0, "SE": 1, "SW": 2, "W": 3, "NW": 4, "NE": 5 }

const edgeUp: { [name: string]: Dir } = 
  { "S":  0, "SW": 1, "NW": 2, "N": 3, "NE": 4, "SE": 5 }

const root_3 = Math.sqrt(3)


function isEven(x: number): boolean { return x % 2 === 0 }

function isHex([x,y] : Loc): boolean {
  return isEven(x) && isEven(y)
}



export class Hex {
  radius: number = 1
  width: number  = root_3
  height: number = 2
  edge: number = 1
  edge_k: number = 0.5 * root_3
  orientation: Orientation = "vertex_up"
  unit: string = "px"

  setRadius(r: number) {
    const ra = r / this.radius
    this.radius = r
    this.edge *= ra
    this.width *= ra
    this.height *= ra
  }

  setEdge(e: number) {
    this.edge = e
    this.edge_k = 0.5 * root_3 * e
  }

  setOrientation(o: Orientation) {
    if (this.orientation === o) return
    this.orientation = o
    const t = this.width
    this.width = this.height
    this.height = t
  }

  getHexCoord([x,y]: Loc): [number, number] {

    const xx = Math.ceil(x/2)
    const yy = Math.ceil(y/2)

    return (this.orientation === "vertex_up")
      ? [ (this.width + this.edge) * (xx + 0.5 * yy)
        , (0.75 * this.height + this.edge_k) * yy
        ]
      : [ -this.width * 0.75 * y 
        , this.height * (x + 0.5 * y)
        ]
  }

  getEdgeNCoord(loc: Loc): [number, number] {
    const [a,b] = this.getHexCoord(loc)
    return [ a - this.edge, b + 0.25 * this.height - this.edge_k / 3 ]
  }


  getEdgeSECoord(loc: Loc): [number, number] {
    const [a,b] = this.getHexCoord(loc)

    const kx = this.edge / 4
    const ky = this.edge_k / 6
    return [ a + kx - 0.5 * this.edge, b + 0.25 * this.height + ky - this.edge_k ]
  }

  getEdgeSWCoord(loc: Loc): [number, number] {
    const [a,b] = this.getHexCoord(loc)

    const kx = this.edge / 4
    const ky = this.edge_k / 6
    return [ a + 0.5 * (this.width - this.edge) + kx, b - this.edge_k - ky  ]
  }


  getCoord(loc: Loc): [number, number] {

    const [x,y] = loc 
    const xe = isEven(x)
    const ye = isEven(y)
    return xe? ye? this.getHexCoord(loc) : this.getEdgeSWCoord(loc)
             : ye? this.getEdgeNCoord(loc) : this.getEdgeSECoord(loc)
    /*
    const xx = Math.ceil(x/2)
    const yy = Math.ceil(y/2)

    const xe = isEven(x)
    const ye = isEven(y)

    let xOff = 0
    let yOff = 0
    
    const ek = 0.5 * root_3 * this.edge

    const kx = this.edge / 4
    const ky = root_3 * this.edge / 12

    //if (!xe &&  ye) { xOff = -this.edge; yOff = 0.25 * this.height - ek / 3 }
    if (!xe && ye) { return this.getEdgeNCoord(loc) }
    if (!xe && !ye) { xOff = kx - 0.5*this.edge; yOff = 0.25 * this.height + ky - ek }
    if ( xe && !ye) { xOff = 0.5 * (this.width - this.edge) + kx; yOff = -ek - ky }

    return (this.orientation === "vertex_up")
      ? [ (this.width + this.edge) * (xx + 0.5 * yy) + xOff
        , (0.75 * this.height + ek) * yy + yOff
        ]
      : [ -this.width * 0.75 * y 
        , this.height * (x + 0.5 * y)
        ]*/
  }

  setUnit(u: string) { this.unit = u }
  toUnit(x: number): string { return x + this.unit }

  getDOM(loc: Loc): HTMLElement {
    const [x,y] = loc
    return isEven(x) ? isEven(y)? this.getHexDOM(loc) : this.getEdgeSW(loc)
                     : isEven(y)? this.getEdgeN(loc) : this.getEdgeSE(loc)
  }

  // edge naming for vertex up

  getEdgeN(loc: Loc): HTMLElement {
    const dom = document.createElement("div")
    const style = dom.style
    style.position = "absolute"

    style.width = this.toUnit(this.edge)
    const h = this.radius + root_3 * this.edge / 3
    style.height = this.toUnit(h)
    const [l,t] = this.getCoord(loc)
    style.left = this.toUnit(l)
    style.top = this.toUnit(t)
    style.color = "black"
    const rp = 100 * this.radius / h
    const bp = (100 - rp) / 2
    function perc(a: number) { return a.toString() + "%" } 
    style.clipPath = "polygon(0 " + perc(bp) + ", 50% 0, 100% " + perc(bp) + ", 100% " + perc(rp + bp) + ", 50% 100%, 0 " + perc(100 - bp) + ")"
    style.background = "orange"
    style.transformOrigin = "top left"
    dom.setAttribute("title", loc.toString())
    return dom
  }

  getEdgeSE(loc: Loc): HTMLElement {
    const e = this.getEdgeN(loc)
    const style = e.style
    style.transform = "rotate(120deg)"
    return e
  }

  getEdgeSW(loc: Loc): HTMLElement {
    const e = this.getEdgeN(loc)
    const style = e.style
    style.transform = "rotate(60deg)"
    return e
  }

  getHexDOM(loc: Loc): HTMLElement {
    const dom = document.createElement("div")
    const style = dom.style
    style.position = "absolute"
    dom.setAttribute("title", loc.toString())

    style.width = this.toUnit(this.width + 2)
    style.height = this.toUnit(this.height + 2)

    style.clipPath = this.orientation === "vertex_up"
                   ? "polygon(0 25%, 50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%)"
                   : "polygon(0 50%, 25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%)"
    const [l,t] = this.getCoord(loc)
    style.left = this.toUnit(l-1)
    style.top = this.toUnit(t-1)
    style.color = "black"
    style.textAlign = "center"
    dom.textContent = loc[0] + ", " + loc[1]
    const color = isHex(loc) ? "red" : "green"
    style.backgroundColor = color
    dom.addEventListener("mouseenter",() => style.backgroundColor = "blue")
    dom.addEventListener("mouseleave",() => style.backgroundColor = color )
    return dom
  }
}



export class Grid<T> {

  private hex: Hex = new Hex();
  private hexes: { [x: number]: { [y:number]: T } } = {}
  private orientation: Orientation
  origin: Loc = [0,0]

  constructor(o: Orientation) {
    this.orientation = o
    this.hex.setOrientation(o)
  }

  getHex(): Hex { return this.hex }

  // The direction corresponding to `name`.
  // Valid nemes depend on the oreientation option:
  //    * "vertex_up": "E", "SE", "SW", "W", "NW", "NE"
  //    * "edge_up":   "N", "NE", "SE", "S", "SW", "NW"
  getDir(name: string): Dir {
    switch(this.orientation) {
      case "vertex_up": return vertexUp[name]
      case "edge_up":   return edgeUp[name]
    }
  }

  // The direction `n` turns clockwise from `dir`.
  turnClockwise(dir: Dir, n: number): Dir {
    return (dir + n) % 6
  }

  // The location `n` steps in direction `dir` from `loc`.
  advance([x,y]: Loc, dir: Dir, n: number): Loc {
    const [dx,dy] = neighbourTable[dir]
    return [x+n*dx,y+n*dy]
  }

  // Set the content at `loc` to `a`.
  set([x,y]: Loc, a: T) {
      let col = this.hexes[x]
      if (col === undefined) {
        col = {}
        this.hexes[x] = col
      }
      col[y] = a
  }

  // get(loc: location): content | null
  get([x,y]: Loc): T | null {
      const col = this.hexes[x]
      if (col === undefined) return null
      const a = col[y]
      if (a === undefined) return null
      return a
  }

  *traverse_rectangle(w: number, h: number, start_wide: boolean): Generator<Dir> {
    let wide = start_wide
    let moving: Dir
    let outer: number
    let inner: number
    let next_narrow: number
    let next_wide: number
    switch (this.orientation) {
      case "vertex_up":
        moving = this.getDir("E")
        outer = h
        inner = start_wide? w - 2 : w - 1
        next_narrow = this.getDir("SE")
        next_wide = this.getDir("SW")
        break
      case "edge_up":
        moving = this.getDir("S")
        outer = w
        inner = start_wide? h - 2 : h - 1
        next_narrow = this.getDir("SE")
        next_wide = this.getDir("NE")
        break
    }
    let right = true
    for (let out_ix = 0; out_ix < outer; ++out_ix) {
      if (out_ix > 0) {
        moving = this.turnClockwise(moving,3)
        yield (wide && right || !wide && !right) ? next_wide : next_narrow
        wide = !wide
        right = !right
      }

      for (let in_ix = 0; in_ix < inner; ++in_ix) yield moving
      if (wide) yield moving
    }
  }

}
