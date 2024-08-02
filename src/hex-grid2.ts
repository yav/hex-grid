
const neighbourTable = [ [1, 0], [0, 1], [-1, 1], [-1, 0], [0,-1], [1,-1] ]

// x: E, y: SE
const vertexUp: { [name: string]: Dir } = 
  { "E":  0, "SE": 1, "SW": 2, "W": 3, "NW": 4, "NE": 5 }

// x: S, y: SW
const edgeUp: { [name: string]: Dir } = 
  { "S":  0, "SW": 1, "NW": 2, "N": 3, "NE": 4, "SE": 5 }

const root_3 = Math.sqrt(3)


export type Loc = [number, number]

class LocMap<T> {
  private data: { [x: number]: { [y: number]: T } } = {}

  setLoc([x,y]: Loc, d: T) {
    let col = this.data[x]
    if (col === undefined) {
      col = {}
      this.data[x] = col
    }

    col[y] = d
  }

  getLoc([x,y]: Loc): T | null {
    const col = this.data[x]
    if (col === undefined) return null
    const d = col[y]
    if (y === undefined) return null
    return d
  }
}


export class HexGrid<F,E,V> {
    private faces: { [x: number]: { [y: number]: F } } = {}
    private edges: { [x: number]

}