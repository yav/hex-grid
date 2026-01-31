import { FLoc, ELoc, VLoc, DELoc } from "./coord.ts"


export class FLocMap<T> {
  private data: { [x: number]: { [y: number]: T } } = {}

  setLoc(f: FLoc, d: T) {
    let col = this.data[f.x]
    if (col === undefined) {
      col = {}
      this.data[f.x] = col
    }

    col[f.y] = d
  }

  getLoc(f: FLoc): T | null {
    const col = this.data[f.x]
    if (col === undefined) return null
    const d = col[f.y]
    if (d === undefined) return null
    return d
  }
}

export class ELocMap<T> {
  private data: FLocMap<{ [edge: number]: T }> = new FLocMap();

  setLoc(e: ELoc, d: T) {
    let mp = this.data.getLoc(e.face_loc)
    if (mp === null) {
      mp = {}
      this.data.setLoc(e.face_loc, mp)
    }
    mp[e.number] = d
  }

  getLoc(e: ELoc): T | null {
    const mp = this.data.getLoc(e.face_loc)
    if (mp === null) return null
    const d = mp[e.number]
    if (d === undefined) return null
    return d
  }
}


export class DELocMap<T> {
  private data: ELocMap<{ [edge: number]: T }> = new ELocMap();

  setLoc(e: DELoc, d: T) {
    let mp = this.data.getLoc(e.edge_loc)
    if (mp === null) {
      mp = {}
      this.data.setLoc(e.edge_loc, mp)
    }
    mp[e.reversed? 1 : 0] = d
  }

  getLoc(e: DELoc): T | null {
    const mp = this.data.getLoc(e.edge_loc)
    if (mp === null) return null
    const d = mp[e.reversed? 1 : 0]
    if (d === undefined) return null
    return d
  }
}


export class VLocMap<T> {
  private data: FLocMap<{ [edge: number]: T }> = new FLocMap();

  setLoc(e: VLoc, d: T) {
    let mp = this.data.getLoc(e.face_loc)
    if (mp === null) {
      mp = {}
      this.data.setLoc(e.face_loc, mp)
    }
    mp[e.number] = d
  }

  getLoc(e: ELoc): T | null {
    const mp = this.data.getLoc(e.face_loc)
    if (mp === null) return null
    const d = mp[e.number]
    if (d === undefined) return null
    return d
  }
}
