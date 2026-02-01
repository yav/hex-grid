
const neighborTable = [ [1, 0], [0, 1], [-1, 1], [-1, 0], [0,-1], [1,-1] ]
const internal = Symbol("internal")


/**
 * Represents the orientation of a hexagonal grid.
 * "vertex_up": Hexagons have a vertex at the top.
 * "edge_up": Hexagons have a flat edge at the top.
 */
export type Orientation = "vertex_up" | "edge_up"

/**
 * Returns the opposite orientation of the given one.
 */
export function otherOrientation(x: Orientation): Orientation {
  return x === "vertex_up"? "edge_up" : "vertex_up"
}

/**
 * Represents one of the 6 directions in a hexagonal grid.
 * Directions are indexed 0 to 5, typically starting from the right and moving clockwise.
 */
export class Dir  {
  /** The internal representation of the direction (0 to 5). */
  readonly number: number /* 0 .. 5 */

  /**
   * Creates a new direction.
   * @param n The direction index. It will be normalized to the range [0, 5].
   */
  constructor(n: number = 0) {
    const v = n % 6
    if (v < 0) {
      this.number = 6 + v
    } else {
      this.number = v
    }
  }
  
  /** Returns a new direction rotated clockwise by `n` steps. */
  clockwise        (n: number = 1): Dir { return new Dir(this.number + n) }

  /** Returns a new direction rotated counter-clockwise by `n` steps. */
  counter_clockwise(n: number = 1): Dir { return new Dir(this.number - n) }

  /**
   * Calculates a unit vector for this direction based on orientation and an initial angle offset.
   * Internal helper used by `edge_unit` and `vertex_unit`.
   */
  private relative_unit(o: Orientation, th0: number): [number, number] {
    let th = Math.PI * this.number / 3 - th0
    if (o === "edge_up") th += Math.PI / 2
    return [ Math.cos(th), Math.sin(th) ]
  }

  /** Returns a unit vector pointing towards the center of an edge in this direction. */
  edge_unit(o: Orientation): [number, number] {
    return this.relative_unit(o, 0)
  }

  /** Returns a unit vector pointing towards a vertex in this direction. */
  vertex_unit(o: Orientation): [number, number] {
    return this.relative_unit(o, Math.PI / 6)
  }

  toString(): string { return "Dir(" + this.number + ")" }
}

/** Returns an iterator for all 6 possible directions. */
export function *directions(): Generator<Dir> {
  for (let i = 0; i < 6; ++i) {
    yield new Dir(i)
  }
}



/**
 * Cardinal direction names used for more intuitive direction referencing.
 */
export type DirName = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"

/**
 * Mapping from cardinal direction names to Dir objects, depending on grid orientation.
 */
export const edgeDir =
  { vertex_up:
      { E: new Dir(0), SE: new Dir(1), SW: new Dir(2),
        W: new Dir(3), NW: new Dir(4), NE: new Dir(5),
        N: new Dir(0), S: new Dir(0) // just to make types work
      }
  , edge_up:
     { S: new Dir(0), SW: new Dir(1), NW: new Dir(2),
       N: new Dir(3), NE: new Dir(4), SE: new Dir(5),
       E: new Dir(0), W: new Dir(0)
     }
  }




/**
 * Represents the location of a face (hexagon) in the grid using axial coordinates.
 */
export class FLoc {
  /** Axial x-coordinate. */
  readonly x: number
  /** Axial y-coordinate. */
  readonly y: number

  /**
   * Creates a new face location.
   */
  constructor(x: number = 0, y: number = 0) {
    this.x = x
    this.y = y
  }

  /**
   * Returns a new location by moving `n` steps in the given direction.
   */
  advance(dir: Dir, n: number = 1): FLoc {
    const [dx,dy] = neighborTable[dir.number]
    return new FLoc(this.x + n * dx, this.y + n * dy)
  }

  /** Returns the location of the edge in the given direction. */
  edge(d: Dir): ELoc { return new ELoc(internal, this, d)  }

  /**
   * Returns a directed edge location.
   * @param d The direction of the edge relative to this face.
   * @param clockwise Whether the edge direction should be clockwise around this face.
   */
  directed_edge(d: Dir, clockwise: boolean): DELoc {
    return new DELoc(internal, this.edge(d), clockwise? d.number > 2 : d.number < 3)
  }

  /** Returns the location of the vertex in the given direction. */
  vertex(d: Dir): VLoc { return new VLoc(internal, this, d) }

  /** Returns an iterator for all 6 edges of this face. */
  *edges(): Generator<ELoc> {
    for (const dir of directions())
       yield this.edge(dir)
  }

  /** Returns an iterator for all 6 vertices of this face. */
  *vertices(): Generator<VLoc> {
    for (const dir of directions())
      yield this.vertex(dir)
  }
  
  toString(): string {
    return "FLoc(" + this.x + "," + this.y + ")"
  }
}



/**
 * Represents the location of an edge between two faces.
 */
export class ELoc {
  /** One of the faces touching this edge. */
  readonly face_loc: FLoc
  /** The edge index (0, 1, or 2) relative to `face_loc`. */
  readonly number: number /* 0..2 */

  /**
   * @internal Use `FLoc.edge` to create instances.
   */
  constructor(_token: typeof internal, face: FLoc, dir: Dir) {
    if (dir.number >= 3) {
      this.face_loc = face.advance(dir)
      this.number = dir.number - 3
    } else {
      this.face_loc = face
      this.number = dir.number
    }
  }

  /** Returns this edge with a specific orientation. */
  directed(reversed: boolean): DELoc {
    return new DELoc(internal, this, reversed)
  }

  /** Returns an iterator for the two faces touching this edge. */
  *faces(): Generator<FLoc> {
      yield this.face_loc
      yield this.face_loc.advance(new Dir(this.number))
    }
    
  /** Returns an iterator for the two vertices at the ends of this edge. */
  *vertices(): Generator<VLoc> {
    const dir = new Dir(this.number)
    yield this.face_loc.vertex(dir)
    yield this.face_loc.vertex(dir.clockwise())
  }

  toString(): string {
    return "ELoc(" + this.face_loc + "," + this.number + ")"
  }
}

/**
 * Represents a directed edge on a hexagona grid.
 */
export class DELoc {
  /** The underlying undirected edge. */
  readonly edge_loc: ELoc
  /** Whether the direction is reversed relative to the default. */
  readonly reversed: boolean

  /**
   * @internal Use `FLoc.directed_edge` or `ELoc.directed` to create instances.
   */
  constructor(_token: typeof internal, edge: ELoc, reversed: boolean) {
    this.edge_loc = edge
    this.reversed = reversed
  }

  /** Returns the same edge pointing in the opposite direction. */
  reverse(): DELoc { return new DELoc(internal, this.edge_loc, !this.reversed) }

  /** Returns the face to the right of this directed edge. */
  right_face(): FLoc {
    const e = this.edge_loc
    const f = e.face_loc
    return this.reversed? f.advance(new Dir(e.number)) : f
  }

  /** Returns the face to the left of this directed edge. */
  left_face(): FLoc {
    const e = this.edge_loc
    const f = e.face_loc
    return this.reversed? f : f.advance(new Dir(e.number))
  }

  /** Returns the vertex where this directed edge starts. */
  start_vertex(): VLoc {
    const dd = this.reversed? 1 : 0
    const d = new Dir(this.edge_loc.number + dd)
    return new VLoc(internal, this.edge_loc.face_loc, d)
  }

  /** Returns the vertex where this directed edge ends. */
  end_vertex(): VLoc {
    const dd = this.reversed? 0 : 1
    const d = new Dir(this.edge_loc.number + dd)
    return new VLoc(internal, this.edge_loc.face_loc, d)
  }

  /** Returns the face directly in front of this directed edge. */
  forward_face(): FLoc {
    const e = this.edge_loc
    const n = e.number
    const f = e.face_loc
    const d = this.reversed? -1 : 1
    return f.advance(new Dir(n + d))
  }

  /** Returns the next directed edge when turning left. */
  next_edge_left(): DELoc {
    const n = this.edge_loc.number
    const d = this.reversed? 2 : -1
    return this.forward_face()
               .directed_edge(new Dir(n + d), true)
  }

  /** Returns the next directed edge when turning right. */
  next_edge_right(): DELoc {
    const n = this.edge_loc.number
    const d = this.reversed? 1 : -2
    return this.forward_face()
               .directed_edge(new Dir(n + d), false)
  }

  toString(): string {
    return "DELoc(" + this.edge_loc + "," + this.reversed + ")"
  }

}


/**
 * Represents the location of a vertex where three faces meet.
 */
export class VLoc {
  /** One of the faces touching this vertex. */
  readonly face_loc: FLoc
  /** The vertex index (0 or 1) relative to `face_loc`. */
  readonly number: number /* 0..1 */

  /**
   * @internal Use the methods in `FLoc`, `DELoc` to create instances.
   */
  constructor(_token: typeof internal, face: FLoc, dir: Dir) {
    this.face_loc = face
    let d = dir
    this.number = dir.number

    while (d.number >= 2) {
      this.face_loc = this.face_loc.advance(d)
      d = d.counter_clockwise(2)
    }
    this.number = d.number
  }

  /** Returns an iterator for the three faces meeting at this vertex. */
  *faces(): Generator<FLoc> {
    const f1 = this.face_loc
    yield f1
    const dir = new Dir(this.number)
    yield this.face_loc.advance(dir.counter_clockwise())
    yield this.face_loc.advance(dir)
  }

  /** Returns an iterator for the three edges meeting at this vertex. */
  *edges(): Generator<ELoc> {
    if (this.number === 0) {
      yield this.face_loc.edge(new Dir(0))
      const f2 = this.face_loc.advance(new Dir(5))
      yield f2.edge(new Dir(2))
      yield f2.edge(new Dir(1))
    } else {
      yield this.face_loc.edge(new Dir(1))
      yield this.face_loc.edge(new Dir(0))
      yield this.face_loc.advance(new Dir(0)).edge(new Dir(2))
    }
  }

  toString(): string {
    return "VLoc(" + this.face_loc + "," + this.number + ")"
  }
}

