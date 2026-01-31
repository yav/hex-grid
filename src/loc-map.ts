import { FLoc, ELoc, VLoc, DELoc } from "./coord.ts"

export interface LocMap<K, V> {
  setLoc(k: K, v: V): void
  getLoc(k: K): V | null
}

export class FLocMap<T> implements LocMap<FLoc, T> {
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

abstract class LayeredMap<K, BaseK, V> implements LocMap<K, V> {
  protected abstract data: LocMap<BaseK, { [n: number]: V }>
  protected abstract split(k: K): [BaseK, number]

  setLoc(k: K, d: V) {
    const [base, idx] = this.split(k)
    let mp = this.data.getLoc(base)
    if (mp === null) {
      mp = {}
      this.data.setLoc(base, mp)
    }
    mp[idx] = d
  }

  getLoc(k: K): V | null {
    const [base, idx] = this.split(k)
    const mp = this.data.getLoc(base)
    if (mp === null) return null
    const d = mp[idx]
    if (d === undefined) return null
    return d
  }
}

export class ELocMap<T> extends LayeredMap<ELoc, FLoc, T> {
  protected data = new FLocMap<{ [edge: number]: T }>()
  protected split(e: ELoc): [FLoc, number] {
    return [e.face_loc, e.number]
  }
}


export class DELocMap<T> extends LayeredMap<DELoc, ELoc, T> {
  protected data = new ELocMap<{ [edge: number]: T }>()
  protected split(e: DELoc): [ELoc, number] {
    return [e.edge_loc, e.reversed? 1 : 0]
  }
}


export class VLocMap<T> extends LayeredMap<VLoc, FLoc, T> {
  protected data = new FLocMap<{ [edge: number]: T }>()
  protected split(v: VLoc): [FLoc, number] {
    return [v.face_loc, v.number]
  }
}