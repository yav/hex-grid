
const neighborTable = [ [1, 0], [0, 1], [-1, 1], [-1, 0], [0,-1], [1,-1] ]


export type Orientation = "vertex_up" | "edge_up"

export function otherOrientation(x: Orientation): Orientation {
  return x === "vertex_up"? "edge_up" : "vertex_up"
}

// Directions
export class Dir  {
  readonly number: number /* 0 .. 5 */

  constructor(n: number = 0) {
    const v = n % 6
    if (v < 0) {
      this.number = 6 + v
    } else {
      this.number = v
    }
  }
  
  clockwise        (n: number = 1): Dir { return new Dir(this.number + n) }
  counter_clockwise(n: number = 1): Dir { return new Dir(this.number - n) }

  relative_unit(o: Orientation, th0: number): [number, number] {
    let th = Math.PI * this.number / 3 - th0
    if (o === "edge_up") th += Math.PI / 2
    return [ Math.cos(th), Math.sin(th) ]
  }

  edge_unit(o: Orientation): [number, number] {
    return this.relative_unit(o, 0)
  }

  vertex_unit(o: Orientation): [number, number] {
    return this.relative_unit(o, Math.PI / 6)
  }

  toString(): string { return "Dir(" + this.number + ")" }
}

export function *directions(): Generator<Dir> {
  for (let i = 0; i < 6; ++i) {
    yield new Dir(i)
  }
}



export type DirName = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"

// Names of edge directions in a vertex-up orientation
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




// Face locations
export class FLoc {
  readonly x: number
  readonly y: number

  constructor(x: number = 0, y: number = 0) {
    this.x = x
    this.y = y
  }

  // Move the location `n` steps in direction `dir` from this.
  advance(dir: Dir, n: number = 1): FLoc {
    const [dx,dy] = neighborTable[dir.number]
    return new FLoc(this.x + n * dx, this.y + n * dy)
  }

  // The location of the edge in the given direction
  edge(d: Dir): ELoc { return new ELoc(this,d)  }

  // The location of the edge in the given direction.
  // The second argument specifies if the edge is facing clockwise
  // relative to this face, or not.
  directed_edge(d: Dir, clockwise: boolean): DELoc {
    return new DELoc(this.edge(d), clockwise? d.number > 2 : d.number < 3)
  }

  // The location of the starting vertex of the edge in the given direction.
  // Edge point clockwise.
  vertex(d: Dir): VLoc { return new VLoc(this,d) }

  // The edges neighboring this face (6)
  *edges(): Generator<ELoc> {
    for (const dir of directions())
       yield this.edge(dir)
  }

  // The vertices touching this face (6)
  *vertices(): Generator<VLoc> {
    for (const dir of directions())
      yield this.vertex(dir)
  }
  
  toString(): string {
    return "FLoc(" + this.x + "," + this.y + ")"
  }
}



// Edge locations
export class ELoc {
  readonly face_loc: FLoc
  readonly number: number /* 0..2 */

  constructor(face: FLoc, dir: Dir) {
    if (dir.number >= 3) {
      this.face_loc = face.advance(dir)
      this.number = dir.number - 3
    } else {
      this.face_loc = face
      this.number = dir.number
    }
  }

  // The faces touching this edge (2)
  *faces(): Generator<FLoc> {
      yield this.face_loc
      yield this.face_loc.advance(new Dir(this.number))
    }
    
  // The vertices touching this edge (2)
  *vertices(): Generator<VLoc> {
    const dir = new Dir(this.number)
    yield this.face_loc.vertex(dir)
    yield this.face_loc.vertex(dir.clockwise())
  }

  toString(): string {
    return "ELoc(" + this.face_loc + "," + this.number + ")"
  }
}

// Directed edge location
export class DELoc {
  readonly edge_loc: ELoc
  readonly reversed: boolean

  // Using the `directed_edge` method of `FLoc` is the easiest way to
  // construct this.
  constructor(edge: ELoc, reversed: boolean) {
    this.edge_loc = edge
    this.reversed = reversed
  }

  reverse(): DELoc { return new DELoc(this.edge_loc, !this.reversed) }

  right_face(): FLoc {
    const e = this.edge_loc
    const f = e.face_loc
    return this.reversed? f.advance(new Dir(e.number)) : f
  }

  left_face(): FLoc {
    const e = this.edge_loc
    const f = e.face_loc
    return this.reversed? f : f.advance(new Dir(e.number))
  }

  start_vertex(): VLoc {
    const dd = this.reversed? 1 : 0
    const d = new Dir(this.edge_loc.number + dd)
    return new VLoc(this.edge_loc.face_loc, d)
  }

  end_vertex(): VLoc {
    const dd = this.reversed? 0 : 1
    const d = new Dir(this.edge_loc.number + dd)
    return new VLoc(this.edge_loc.face_loc, d)
  }

  // The face at the front of the edge
  forward_face(): FLoc {
    const e = this.edge_loc
    const n = e.number
    const f = e.face_loc
    const d = this.reversed? -1 : 1
    return f.advance(new Dir(n + d))
  }

  next_edge_left(): DELoc {
    const n = this.edge_loc.number
    const d = this.reversed? 2 : -1
    return this.forward_face()
               .directed_edge(new Dir(n + d), true)
  }

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


// Vertex locations
export class VLoc {
  readonly face_loc: FLoc
  readonly number: number /* 0..1 */

  // A vertex on a face.  The direction is that of the
  // edge starting at the desired vertex and pointing clockwise.
  constructor(face: FLoc, dir: Dir) {
    this.face_loc = face
    let d = dir
    this.number = dir.number

    while (d.number >= 2) {
      this.face_loc = this.face_loc.advance(d)
      d = d.counter_clockwise(2)
    }
    this.number = d.number
  }

  // Faces meeting at a vertex (3)
  *faces(): Generator<FLoc> {
    const f1 = this.face_loc
    yield f1
    const dir = new Dir(this.number)
    yield this.face_loc.advance(dir.counter_clockwise())
    yield this.face_loc.advance(dir)
  }

  // Edges meeting at this vertex (3)
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

