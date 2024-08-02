
export type Loc = [number, number]

export class LocMap<T> {
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
