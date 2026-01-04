import { Orientation, Dir,  FLoc, ELoc, VLoc, DirName,
            edgeDir, otherOrientation } from "./coord.ts"

const root_3 = Math.sqrt(3)


export class Grid {

  orientation: Orientation
  unit: string = "px"

  // Distance from vertex to vertex through center
  outer_diameter!: number

  // Distance from edge to edge through center
  inner_diameter!: number

  // Space between faces
  spacing: number

  x_dx!: number
  x_dy!: number
  y_dx!: number
  y_dy!: number

  constructor() {
    this.orientation = "vertex_up"
    this.setOuterDiameter(100)
    this.spacing = 5
  }

  toUnit(x: number): string { return x + this.unit }

  setOrientation(o: Orientation) {
    this.orientation = o
    this.setDirections()
  }

  setInnerDiameter(r: number) {
    this.inner_diameter = r
    this.outer_diameter = 2 * r / root_3 
    this.setDirections()
  }

  setOuterDiameter(r: number) {
    this.outer_diameter = r
    this.inner_diameter = root_3 * r / 2
    this.setDirections()
  }

  setSpacing(s: number) {
    this.spacing = s
    this.setDirections()
  }

  setDirections() {
    const l = this.inner_diameter + this.spacing
    const [x_dx, x_dy] = new Dir(0).edge_unit(this.orientation)
    const [y_dx, y_dy] = new Dir(1).edge_unit(this.orientation)
    this.x_dx = l * x_dx
    this.x_dy = l * x_dy
    this.y_dx = l * y_dx
    this.y_dy = l * y_dy
  }

  isVertexUp(): boolean { return this.orientation === "vertex_up" }


  edgeDir(d: DirName): Dir { return edgeDir[this.orientation][d] }
  vertexDir(d: DirName): Dir { return edgeDir[otherOrientation(this.orientation)][d] }

  faceBoundingBox(): [number, number] {
    const vup = this.orientation === "vertex_up"
    const w   = vup? this.inner_diameter : this.outer_diameter
    const h   = vup? this.outer_diameter : this.inner_diameter
    return [w,h]
  }

  edgeBoundingBox(): [number, number] {
    const w = this.spacing
    const h = this.outer_diameter/2 + w * root_3/3
    return [w,h]
  }

  vertexBoundingBox(): [number, number] {
    const sz = 2 * root_3 * this.spacing / 3
    return [sz,sz]
  }
  
  // Center of hexagon
  faceLoc(face: FLoc): [number, number] {
    const x = face.x
    const y = face.y
    return [ x * this.x_dx + y * this.y_dx, x * this.x_dy + y * this.y_dy ]
  }

  // Center fo edge
  edgeLoc(edge: ELoc): [number, number] {
    const [x,y] = this.faceLoc(edge.face)
    const [dx,dy] = new Dir(edge.number).edge_unit(this.orientation)
    const l = (this.inner_diameter + this.spacing) / 2
    return [ x + l * dx, y + l * dy ]
  }

  // Center of vertex
  vertexLoc(vertex: VLoc): [number, number] {
    const [x,y] = this.faceLoc(vertex.face)
    const [dx,dy] = new Dir(vertex.number).vertex_unit(this.orientation)
    const l = this.outer_diameter / 2 + root_3 * this.spacing / 3
    return [x + dx * l, y + dy * l ]
  }

  *traverseFaces(w: number, h: number, wide: boolean = true): Generator<Dir> {
      let dir     = new Dir(0)
      const vup   = this.orientation === "vertex_up"
      const nl    = new Dir(vup? (wide? 2 : 1) : wide? 4 : 5)
      const outer = (vup? h : w)
      const inner = (vup? w : h) - 2

      for (let r = 0; r < outer; ++r) {
        for (let c = 0; c < inner; ++c) yield dir.clone()
        if (wide) yield dir.clone()
        wide = !wide
        dir.clockwise(3)
        if (r < outer - 1) yield nl.clone()
      }
  }
  

}