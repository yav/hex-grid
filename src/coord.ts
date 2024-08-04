
const neighbourTable = [ [1, 0], [0, 1], [-1, 1], [-1, 0], [0,-1], [1,-1] ]


export type Orientation = "vertex_up" | "edge_up"



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
    if (this.number < 0) this.number = 6 - this.number
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


// Names of edge directions in a vertex-up orientation
export const dirName =
  { "vertex_up": // vertex_up
      { E: new Dir(0), SE: new Dir(1), SW: new Dir(2),
        W: new Dir(3), NW: new Dir(4), NE: new Dir(5)
      } 
  , "edge_up":
     { S: new Dir(0), SW: new Dir(1), NW: new Dir(2),
       N: new Dir(3), NE: new Dir(4), SE: new Dir(5)
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
    const [dx,dy] = neighbourTable[dir.number]
    this.x += n * dx
    this.y += n * dy
  }

  // The edges neighbouring this face (6)
  *edges(): Generator<ELoc> {
    for (const dir of directions())
       yield new ELoc(this,dir)
  }

  // The vertices touching this face (6)
  *vertices(): Generator<VLoc> {
    for (const dir of directions())
      yield vloc_from_face(this,dir)
  }
  
}



// Edge locations
export class ELoc {
  face:   FLoc
  number: number /* 0..2 */

  constructor(face: FLoc, dir: Dir) {
    this.face   = face.clone()
    this.number = dir.number
    if (dir.number >= 3) {
      this.face.advance(dir)
      this.number -= 3
    }
  }

  clone(): ELoc { return new ELoc(this.face, new Dir(this.number)) }

  // The faces touching this edge (2)
  *faces(): Generator<FLoc> {
      const f1 = this.face.clone()
      f1.advance(new Dir(this.number))
      yield f1
      yield this.face.clone()
    }
    
  // The vertices touching this edge (2)
  *vertices(): Generator<VLoc> {
    const dir = new Dir(this.number)
    yield vloc_from_face(this.face, dir)
    dir.clockwise()
    yield vloc_from_face(this.face, dir)
  }
    

}



// Vertex locations
export class VLoc {
  face:   FLoc = new FLoc()
  number: number = 0 /* 0..1 */

  clone(): VLoc {
    const o = new VLoc()
    o.face = this.face.clone()
    o.number = this.number
    return o
  }

  // The vertex in the given direction of the face.
  // XXX: vertices and edges use different direction types, does it matter?
  setFromFace (face: FLoc, dir: Dir) {
    this.face   = face.clone()
    this.number = dir.number

    while (this.number >= 2) {
      this.face.advance(dir)
      dir.number -= 2
      this.number = dir.number
    }
  }

  // The vertex at the end of the edge.
  // Vertex 0 is the at the start of the edge,
  // when the edge is facing clockwise.
  setFromEdge (edge: ELoc, n: number) {
    this.setFromFace(edge.face, new Dir(this.number + n))
  }


  // Faces meeting at a vertex (3)
  *faces(): Generator<FLoc> {
    const f1 = this.face.clone()
    yield f1
    const f2 = this.face.clone()
    const dir = new Dir(this.number)
    f2.advance(dir)
    yield f2
    const f3 = this.face.clone()
    dir.counter_clockwise()
    f3.advance(dir)
    yield f3
  }

  // Edges meeting at this vertex (3)
  *edges(): Generator<ELoc> {
    if (this.number === 0) {
      const f2 = this.face.clone()
      f2.advance(new Dir(5))
      yield new ELoc(this.face, new Dir(0))
      yield new ELoc(f2, new Dir(2))
      yield new ELoc(f2, new Dir(1))
    } else {
      const f2 = this.face.clone()
      f2.advance(new Dir(0))
      yield new ELoc(this.face, new Dir(2)) 
      yield new ELoc(f2, new Dir(2))
      yield new ELoc(this.face, new Dir(1))
    }
  }
}

export function vloc_from_face(face: FLoc, dir: Dir): VLoc {
  const v = new VLoc()
  v.setFromFace(face,dir)
  return v
}

export function vloc_fromedge(edge: ELoc, n: number): VLoc {
  const v = new VLoc()
  v.setFromEdge(edge,n)
  return v
}


