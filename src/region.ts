import { FLoc, ELoc, VLoc, DELoc, Dir, Orientation } from "./coord.ts"
import { FLocMap, ELocMap, VLocMap } from "./loc-map.ts"

/**
 * Represents a bounded region of the hexagonal grid.
 * Provides membership testing and iteration for faces, edges, and vertices.
 */
export abstract class Region {
  /** Tests if a face is contained in this region. */
  abstract containsFace(face: FLoc): boolean

  /** Tests if an edge is contained in this region.
   * An edge is in the region if at least one adjacent face is in the region.
   */
  containsEdge(edge: ELoc): boolean {
    for (const face of edge.faces()) {
      if (this.containsFace(face)) return true
    }
    return false
  }

  /** Tests if a vertex is contained in this region.
   * A vertex is in the region if at least one adjacent face is in the region.
   */
  containsVertex(vertex: VLoc): boolean {
    for (const face of vertex.faces()) {
      if (this.containsFace(face)) return true
    }
    return false
  }

  /** Tests if a directed edge is contained in this region.
   * Same as containsEdge since direction doesn't affect membership.
   */
  containsDirectedEdge(de: DELoc): boolean {
    return this.containsEdge(de.edge_loc)
  }

  /** Returns an iterator over all faces in the region. */
  abstract faces(): Generator<FLoc>

  /** Returns an iterator over all edges in the region.
   * Includes all edges of faces in the region.
   */
  *edges(): Generator<ELoc> {
    const visited = new ELocMap<boolean>()

    for (const face of this.faces()) {
      for (const edge of face.edges()) {
        if (visited.getLoc(edge)) continue
        visited.setLoc(edge, true)
        yield edge
      }
    }
  }

  /** Returns an iterator over all vertices in the region.
   * Includes all vertices of faces in the region.
   */
  *vertices(): Generator<VLoc> {
    const visited = new VLocMap<boolean>()

    for (const face of this.faces()) {
      for (const vertex of face.vertices()) {
        if (visited.getLoc(vertex)) continue
        visited.setLoc(vertex, true)
        yield vertex
      }
    }
  }
}

/**
 * A rectangular region of hexagons on the grid.
 * The region alternates between "wide" and "narrow" rows.
 * For vertex_up orientation, width refers to the number of hexagons in a wide row.
 * Wide rows have 'width' hexagons, narrow rows have 'width - 1' hexagons.
 * For edge_up orientation, height refers to the number of hexagons in a wide column.
 */
export class RectangularRegion extends Region {
  private readonly origin: FLoc
  private readonly width: number
  private readonly height: number
  private readonly startsWide: boolean
  private readonly orientation: Orientation
  private readonly faceSet: FLocMap<boolean>

  /**
   * Creates a rectangular region.
   * @param origin The top-left face of the rectangle.
   * @param width For vertex_up: the number of hexagons in a wide row.
   *              For edge_up: the number of rows.
   * @param height For vertex_up: the number of rows.
   *               For edge_up: the number of hexagons in a wide column.
   * @param startsWide Whether the first row (vertex_up) or column (edge_up) is wide.
   * @param orientation The grid orientation (affects traversal direction).
   */
  constructor(
    origin: FLoc,
    width: number,
    height: number,
    startsWide: boolean,
    orientation: Orientation = "vertex_up"
  ) {
    super()
    this.origin = origin
    this.width = width
    this.height = height
    this.startsWide = startsWide
    this.orientation = orientation
    this.faceSet = new FLocMap<boolean>()

    // Pre-compute all faces in the region
    for (const face of this.computeFaces()) {
      this.faceSet.setLoc(face, true)
    }
  }

  containsFace(face: FLoc): boolean {
    return this.faceSet.getLoc(face) !== null
  }

  /**
   * Iterates over all faces in the region.
   * Traversal order:
   * - For vertex_up: goes row by row from top to bottom,
   *   within each row moves left to right (direction 0).
   * - For edge_up: goes column by column,
   *   within each column moves in direction 0.
   */
  *faces(): Generator<FLoc> {
    yield* this.computeFaces()
  }

  private *computeFaces(): Generator<FLoc> {
    let pos = this.origin
    let wide = this.startsWide
    const vup = this.orientation === "vertex_up"

    // Outer and inner dimensions depend on orientation
    const outer = vup ? this.height : this.width
    const inner = (vup ? this.width : this.height) - 1

    for (let r = 0; r < outer; ++r) {
      // Remember the start of this row
      const rowStart = pos

      // Yield faces in this row
      const rowLength = inner + (wide ? 1 : 0)
      for (let c = 0; c < rowLength; ++c) {
        yield pos
        if (c < rowLength - 1) {
          pos = pos.advance(new Dir(0))
        }
      }

      // Move to next row
      if (r < outer - 1) {
        // Direction to next row depends on current row's width
        const nl = new Dir(vup ? (wide ? 2 : 1) : wide ? 4 : 5)
        pos = rowStart.advance(nl)
        wide = !wide
      }
    }
  }
}

/**
 * A hexagonal region centered on a face with a given radius.
 * Includes all faces within the given distance from the center.
 */
export class HexagonalRegion extends Region {
  private readonly center: FLoc
  private readonly radius: number

  /**
   * Creates a hexagonal region.
   * @param center The center face of the hexagon.
   * @param radius The radius in faces (distance from center to edge).
   */
  constructor(center: FLoc, radius: number) {
    super()
    this.center = center
    this.radius = radius
  }

  containsFace(face: FLoc): boolean {
    return this.center.distance(face) <= this.radius
  }

  /**
   * Iterates over all faces in the region.
   * Traversal order:
   * - First yields the center face
   * - Then yields faces in rings of increasing radius (1 to radius)
   * - Each ring starts at distance r in direction 0, then walks around
   *   the ring using directions 0-5 in sequence
   */
  *faces(): Generator<FLoc> {
    // Center face
    yield this.center

    // Rings around the center
    for (let r = 1; r <= this.radius; r++) {
      // Start at distance r in direction 0
      // (the starting direction is arbitrary - any direction 0-5 would work)
      let pos = this.center.advance(new Dir(0), r)

      // Walk around the ring
      for (let side = 0; side < 6; side++) {
        const dir = new Dir(side)
        for (let step = 0; step < r; step++) {
          yield pos
          pos = pos.advance(dir)
        }
      }
    }
  }
}
