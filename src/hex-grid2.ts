import { Orientation, Dir,  FLoc, ELoc, VLoc } from "./coord.ts"

const root_3 = Math.sqrt(3)


export class Grid {

  orientation: Orientation

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

  setDirections() {
    const l = this.inner_diameter + this.spacing
    const [x_dx, x_dy] = new Dir(0).edge_unit(this.orientation)
    const [y_dx, y_dy] = new Dir(1).edge_unit(this.orientation)
    this.x_dx = l * x_dx
    this.x_dy = l * x_dy
    this.y_dx = l * y_dx
    this.y_dy = l * y_dy
  }

  faceLoc(face: FLoc): [number, number] {
    const x = face.x
    const y = face.y
    return [ x * this.x_dx + y * this.y_dx, x * this.x_dy + y * this.y_dy ]
  }

  edgeLoc(edge: ELoc): [number, number] {
    const [x,y] = this.faceLoc(edge.face)
    const [dx,dy] = new Dir(edge.number).edge_unit(this.orientation)
    const l = (this.inner_diameter + this.spacing) / 2
    return [ x + l * dx, y + l * dy ]
  }

  vertexLoc(vertex: VLoc): [number, number] {
    const [x,y] = this.faceLoc(vertex.face)
    const [dx,dy] = new Dir(vertex.number).vertex_unit(this.orientation)
    const l = (this.outer_diameter + this.spacing * root_3) / 2
    return [x + dx * l, y + dy * l ]
  }
  

}