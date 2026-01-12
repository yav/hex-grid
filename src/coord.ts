
const neighborTable = [ [1, 0], [0, 1], [-1, 1], [-1, 0], [0,-1], [1,-1] ]


export type Orientation = "vertex_up" | "edge_up"

export function otherOrientation(x: Orientation): Orientation {
  return x === "vertex_up"? "edge_up" : "vertex_up"
}

// Directions
export class Dir  {
  number: number /* 0 .. 5 */

  constructor(n: number = 0) {
    this.number = n
    this.normalize()
  }

  clone(): Dir { const dir = new Dir(); dir.number = this.number; return dir }
  
  // Set the direction in the range 0 .. 5, using modulo arithmetic.
  normalize() {
    this.number %= 6
    if (this.number < 0) this.number = 6 + this.number
  }
  
  clockwise        (n: number = 1) { this.number += n; this.normalize() }
  counter_clockwise(n: number = 1) { this.number -= n; this.normalize() }

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
  x: number
  y: number

  constructor(x: number = 0, y: number = 0) {
    this.x = x
    this.y = y
  }

  clone(): FLoc {
    const o = new FLoc();
    o.x = this.x
    o.y = this.y
    return o
  }

  // Move the location `n` steps in direction `dir` from this.
  advance(dir: Dir, n: number = 1) {
    const [dx,dy] = neighborTable[dir.number]
    this.x += n * dx
    this.y += n * dy
  }

  // The location of the edge in the given direction
  edge(d: Dir): ELoc { return new ELoc(this,d)  }

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
  
}



// Edge locations
export class ELoc {
  face_loc: FLoc
  number: number /* 0..2 */

  constructor(face: FLoc, dir: Dir) {
    this.face_loc   = face.clone()
    this.number = dir.number
    if (dir.number >= 3) {
      this.face_loc.advance(dir)
      this.number -= 3
    }
  }

  clone(): ELoc { return new ELoc(this.face_loc, new Dir(this.number)) }

  face(n: number /* 0 .. 1 */): FLoc {
    let f = this.face_loc.clone()
    if (n > 0) f.advance(new Dir(this.number))
    return f
  }

  // Get a vertex on this edge.
  vertex(n: number /* 0 .. 1 */): VLoc {
    return new VLoc(this.face_loc, new Dir(this.number + n))
  }

  // The faces touching this edge (2)
  *faces(): Generator<FLoc> {
      const f1 = this.face_loc.clone()
      f1.advance(new Dir(this.number))
      yield f1
      yield this.face_loc.clone()
    }
    
  // The vertices touching this edge (2)
  *vertices(): Generator<VLoc> {
    const dir = new Dir(this.number)
    yield this.face_loc.vertex(dir)
    dir.clockwise()
    yield this.face_loc.vertex(dir)
  }
    

}



// Vertex locations
export class VLoc {
  face_loc:   FLoc = new FLoc()
  number: number = 0 /* 0..1 */

  // A vertex on a face.  The direction is that of the
  // edge starting at the desired vertex and pointing clockwise.
  constructor(face: FLoc, dir: Dir) {
    this.face_loc   = face.clone()
    this.number = dir.number

    while (this.number >= 2) {
      this.face_loc.advance(dir)
      dir.number -= 2
      this.number = dir.number
    }
  }

  clone(): VLoc {
    return new VLoc(this.face_loc, new Dir(this.number))
  }

  // Faces meeting at a vertex (3)
  *faces(): Generator<FLoc> {
    const f1 = this.face_loc.clone()
    yield f1
    const f2 = this.face_loc.clone()
    const dir = new Dir(this.number)
    f2.advance(dir)
    yield f2
    const f3 = this.face_loc.clone()
    dir.counter_clockwise()
    f3.advance(dir)
    yield f3
  }

  // Edges meeting at this vertex (3)
  *edges(): Generator<ELoc> {
    if (this.number === 0) {
      const f2 = this.face_loc.clone()
      f2.advance(new Dir(5))
      yield this.face_loc.edge(new Dir(0))
      yield f2.edge(new Dir(2))
      yield f2.edge(new Dir(1))
    } else {
      const f2 = this.face_loc.clone()
      f2.advance(new Dir(0))
      yield this.face_loc.edge(new Dir(1))
      yield this.face_loc.edge(new Dir(0))
      yield f2.edge(new Dir(2))
    }
  }
}

