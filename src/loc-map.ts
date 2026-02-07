import { FLoc, ELoc, VLoc, DELoc } from "./coord.ts"

/**
 * Common interface for maps keyed by grid locations.
 * @internal
 */
interface LocMap<K, V> {

  /** Associates a value with a location. */
  setLoc(k: K, v: V): void

  /** Retrieves the value associated with a location, or null if not found. */
  getLoc(k: K): V | null
}

/**
 * A map for storing data associated with faces (hexagons).
 */
export class FLocMap<T> implements LocMap<FLoc, T> {
  private data: { [x: number]: { [y: number]: T } } = {}

  /** Associates a value with a face location. */
  setLoc(f: FLoc, d: T) {
    let col = this.data[f.x]
    if (col === undefined) {
      col = {}
      this.data[f.x] = col
    }

    col[f.y] = d
  }

  /** Retrieves the value associated with a face location. */
  getLoc(f: FLoc): T | null {
    const col = this.data[f.x]
    if (col === undefined) return null
    const d = col[f.y]
    if (d === undefined) return null
    return d
  }
}

/**
 * Abstract base class for maps that are layered on top of another LocMap.
 * @internal
 */
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

/**
 * A map for storing data associated with edges.
 */
export class ELocMap<T> extends LayeredMap<ELoc, FLoc, T> {
  protected data = new FLocMap<{ [edge: number]: T }>()
  protected split(e: ELoc): [FLoc, number] {
    return [e.face_loc, e.number]
  }
}

/**
 * A map for storing data associated with directed edges.
 */
export class DELocMap<T> extends LayeredMap<DELoc, ELoc, T> {
  protected data = new ELocMap<{ [edge: number]: T }>()
  protected split(e: DELoc): [ELoc, number] {
    return [e.edge_loc, e.reversed? 1 : 0]
  }
}


/**
 * A map for storing data associated with vertices.
 */
export class VLocMap<T> extends LayeredMap<VLoc, FLoc, T> {
  protected data = new FLocMap<{ [edge: number]: T }>()
  protected split(v: VLoc): [FLoc, number] {
    return [v.face_loc, v.number]
  }
}

/**
 * A filtered wrapper around an underlying location map.
 * Filters all operations through a membership predicate.
 *
 * This is a generic wrapper that works with any map type (FLocMap, ELocMap, etc.)
 * by delegating to the underlying map while checking location membership.
 */
export class FilteredLocMap<Loc, T> implements LocMap<Loc, T> {
  private readonly map: LocMap<Loc, T>
  private readonly contains: (loc: Loc) => boolean

  /**
   * Creates a filtered location map.
   * @param map The underlying map to wrap (e.g., FLocMap, ELocMap, VLocMap, DELocMap).
   * @param contains A predicate that determines if a location should be included.
   */
  constructor(
    map: LocMap<Loc, T>,
    contains: (loc: Loc) => boolean
  ) {
    this.map = map
    this.contains = contains
  }

  /**
   * Associates a value with a location.
   * Does nothing if the location does not satisfy the predicate.
   */
  setLoc(loc: Loc, value: T): void {
    if (!this.contains(loc)) {
      return
    }
    this.map.setLoc(loc, value)
  }

  /**
   * Retrieves the value associated with a location.
   * Returns null if the location does not satisfy the predicate or has no associated value.
   */
  getLoc(loc: Loc): T | null {
    if (!this.contains(loc)) {
      return null
    }
    return this.map.getLoc(loc)
  }
}