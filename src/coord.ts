
const neighbourTable = [ [1, 0], [0, 1], [-1, 1], [-1, 0], [0,-1], [1,-1] ]

const vertexUp: { [name: string]: Dir } = 
  { "E":  0, "SE": 1, "SW": 2, "W": 3, "NW": 4, "NE": 5 }

const edgeUp: { [name: string]: Dir } = 
  { "S":  0, "SW": 1, "NW": 2, "N": 3, "NE": 4, "SE": 5 }

export type FLoc = [ number, number ]
export type ELoc = [ FLoc, number /* 0..2 */ ]
export type VLoc = [ FLoc, number /* 0..1 */ ] 
export type Dir  = number /* 0 .. 5 */



export const origin: FLoc = [0,0]


export function turn_clockwise(d: Dir, n: number = 1): Dir {
  return (d + n) % 6
}

export function turn_counter_clockwise(d: Dir, n: number = 1): Dir {
  return turn_clockwise(d, 6 - n % 6)
}

// The location `n` steps in direction `dir` from `loc`.
export function advance([x,y]: FLoc, dir: Dir, n: number = 1): FLoc {
  const [dx,dy] = neighbourTable[dir]
  return [x+n*dx,y+n*dy]
}

// Edge on a face in the given direction
export function edge_of_face(f: FLoc, d: Dir): ELoc {
  if (d < 3) return [ f, d ]
  return [ advance(f,d), d - 3 ]
}

// Vertex on a face in the given direction
export function vertex_of_face(f: FLoc, d: Dir): VLoc {
  if (d < 2) return [ f, d ]
  const f1 = advance(f,d)
  const d1 = d - 2
  if (d < 4) return [ f1, d1 ]
  return [ advance(f1,d1), d1 - 2 ]
}

export function vertex_of_edge([f,d]: ELoc, n: number): VLoc {
  return vertex_of_face(f,d+n)
}


export function edges_of_face(f: FLoc): ELoc[] {
  const res = []
  for (let d = 0; d < 6; ++d)
     res.push(edge_of_face(f,d))
  return res
}

export function vertices_of_face(f: FLoc): VLoc[] {
  const res = []
  for (let d = 0; d < 6; ++d)
     res.push(vertex_of_face(f,d))
  return res
}


export function faces_of_edge([f,d]: ELoc): [FLoc, FLoc] {
  return [ advance(f,d), f ]
}

export function vertices_of_edge([f,d]: ELoc): [VLoc,VLoc] {
  return [ vertex_of_face(f,d), vertex_of_face(f,d+1) ]
}

export function edges_of_vertex([f,d]: VLoc): [ELoc,ELoc,ELoc] {
  const d1 = turn_counter_clockwise(d)
  const f1 = advance(f,d1)
  if (d == 0) return [ [f1,1], [f1,2], [f,0] ]
  return [ [f,0], [f,1], [f1,2] ]
}

// Faces meeting at a vertex
export function faces_of_vertex([f,d]: VLoc): [FLoc,FLoc,FLoc] {
  const f1 = advance(f,d)
  return [ f, f1, advance(f1,turn_counter_clockwise(d))  ]
}
