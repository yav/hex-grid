import { Orientation, Dir,  FLoc, ELoc, VLoc, DirName,
            edgeDir, otherOrientation } from "./coord.ts"

const root_3 = Math.sqrt(3)


/**
 * Manages the layout and coordinate transformations of a hexagonal grid.
 */
export class Grid {

  /** The current orientation of the grid (vertex up or edge up). */
  orientation: Orientation

  /** The CSS unit used for measurements (e.g., "px", "em"). */
  unit: string = "px"

  /** Distance from vertex to vertex through the center. */
  outer_diameter!: number

  /** Distance from edge to edge through the center. */
  inner_diameter!: number

  /** Space between the faces of the hexagons. */
  spacing: number

  /** Change in pixel x per unit of axial x. */
  x_dx!: number

  /** Change in pixel y per unit of axial x. */
  x_dy!: number

  /** Change in pixel x per unit of axial y. */
  y_dx!: number

  /** Change in pixel y per unit of axial y. */
  y_dy!: number


  /** Creates a new grid with default settings. */
  constructor() {
    this.orientation = "vertex_up"
    this.setOuterDiameter(100)
    this.spacing = 5
  }

  /** A helper to render a number as text using the given units (e.g., `px`) */
  toUnit(x: number): string { return x + this.unit }

  /** Sets the grid's orientation and updates layout parameters. */
  setOrientation(o: Orientation) {
    this.orientation = o
    this.setDirections()
  }

  /** Sets the distance between edges and updates layout parameters. */
  setInnerDiameter(r: number) {
    this.inner_diameter = r
    this.outer_diameter = 2 * r / root_3 
    this.setDirections()
  }

  /** Sets the distance between vertices and updates layout parameters. */
  setOuterDiameter(r: number) {
    this.outer_diameter = r
    this.inner_diameter = root_3 * r / 2
    this.setDirections()
  }

  /** Sets the space between faces and updates layout parameters. */
  setSpacing(s: number) {
    this.spacing = s
    this.setDirections()
  }

  /** Recalculates layout parameters. */
  setDirections() {
    const l = this.inner_diameter + this.spacing
    const [x_dx, x_dy] = new Dir(0).edge_unit(this.orientation)
    const [y_dx, y_dy] = new Dir(1).edge_unit(this.orientation)
    this.x_dx = l * x_dx
    this.x_dy = l * x_dy
    this.y_dx = l * y_dx
    this.y_dy = l * y_dy
  }

  /** Returns true if the grid is oriented with a vertex pointing up. */
  isVertexUp(): boolean { return this.orientation === "vertex_up" }


  /** Returns a direction object for a named edge. */
  edgeDir(d: DirName): Dir { return edgeDir[this.orientation][d] }

  /** Returns a direction object for a named vertex. */
  vertexDir(d: DirName): Dir { return edgeDir[otherOrientation(this.orientation)][d] }

  /** Returns the [width, height] of a face's bounding box. */
  faceBoundingBox(): [number, number] {
    const vup = this.orientation === "vertex_up"
    const w   = vup? this.inner_diameter : this.outer_diameter
    const h   = vup? this.outer_diameter : this.inner_diameter
    return [w,h]
  }

  /** Returns the [width, height] of an edge's bounding box. */
  edgeBoundingBox(): [number, number] {
    const w = this.spacing
    const h = this.outer_diameter/2 + w * root_3/3
    return [w,h]
  }

  /** Returns the [width, height] of a vertex's bounding box. */
  vertexBoundingBox(): [number, number] {
    const sz = 2 * root_3 * this.spacing / 3
    return [sz,sz]
  }

  /**
   * Calculates the pixel coordinates of the center of a face.
   * @param face The location of the face.
   * @returns [x, y] pixel coordinates.
   */
  faceLoc(face: FLoc): [number, number] {
    const x = face.x
    const y = face.y
    return [ x * this.x_dx + y * this.y_dx, x * this.x_dy + y * this.y_dy ]
  }

  /**
   * Calculates the pixel coordinates of the center of an edge.
   * @param edge The location of the edge.
   * @returns [x, y] pixel coordinates.
   */
  edgeLoc(edge: ELoc): [number, number] {
    const [x,y] = this.faceLoc(edge.face_loc)
    const [dx,dy] = new Dir(edge.number).edge_unit(this.orientation)
    const l = (this.inner_diameter + this.spacing) / 2
    return [ x + l * dx, y + l * dy ]
  }

  /**
   * Calculates the pixel coordinates of a vertex.
   * @param vertex The location of the vertex.
   * @returns [x, y] pixel coordinates.
   */
  vertexLoc(vertex: VLoc): [number, number] {
    const [x,y] = this.faceLoc(vertex.face_loc)
    const [dx,dy] = new Dir(vertex.number).vertex_unit(this.orientation)
    const l = this.outer_diameter / 2 + root_3 * this.spacing / 3
    return [x + dx * l, y + dy * l ]
  }

}