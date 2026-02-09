import { Grid } from "./hex-grid.ts"
import { FLoc, ELoc, VLoc } from "./coord.ts"
import { newHexShape, newEdgeShape, newVertexShapeCirc } from "./shapes.ts"
import { RectangularRegion, HexagonalRegion, Region } from "./region.ts"
import { FLocMap, ELocMap, VLocMap, type LocMap } from "./loc-map.ts"
import type { Orientation } from "./coord.ts"

// Item type system for supporting different colored boxes on the grid
export interface ItemType {
  id: string
  color: string
  displayName: string
}

export interface Item {
  type: ItemType
  id: number  // Unique identifier for this item
}

// Counter for generating unique item IDs
let nextItemId = 0

export function createItem(type: ItemType): Item {
  return {
    type,
    id: nextItemId++
  }
}

export const ITEM_TYPES: ItemType[] = [
  { id: "orange", color: "orange", displayName: "Orange" },
  { id: "blue", color: "blue", displayName: "Blue" },
  { id: "red", color: "red", displayName: "Red" },
  { id: "pink", color: "pink", displayName: "Pink" },
  { id: "purple", color: "purple", displayName: "Purple" },
]

export interface GridConfig {
  orientation: Orientation
  regionType: "rectangular" | "hexagonal"
  rectWidth: number
  rectHeight: number
  rectStartsWide: boolean
  hexRadius: number
  debugHover: boolean
  hexElements: FLocMap<Item[]> // Maps hexagon locations to arrays of items
  edgeElements: ELocMap<Item[]> // Maps edge locations to arrays of items
  vertexElements: VLocMap<Item[]> // Maps vertex locations to arrays of items
  editMode: "none" | "add" | "remove"
  selectedItemType: ItemType // Currently selected item type for add mode
}

export function renderGrid(leftPane: HTMLElement, config: GridConfig) {
  // Clear the left pane and set up for absolute positioning
  leftPane.innerHTML = ""
  leftPane.style.position = "relative"

  // Create debug info tooltip if debug mode is enabled
  let debugTooltip: HTMLDivElement | null = null
  if (config.debugHover) {
    debugTooltip = document.createElement("div")
    debugTooltip.className = "debug-tooltip"
    leftPane.appendChild(debugTooltip)
  }

  // Create and configure the grid
  const grid = new Grid()
  grid.setOrientation(config.orientation)
  grid.setInnerDiameter(64)
  grid.setSpacing(16)

  // Create region based on type
  let region: Region
  if (config.regionType === "rectangular") {
    region = new RectangularRegion(
      new FLoc(),
      config.rectWidth,
      config.rectHeight,
      config.rectStartsWide,
      grid.orientation
    )
  } else {
    region = new HexagonalRegion(new FLoc(), config.hexRadius)
  }

  // Calculate the bounding box of the entire region to find the offset needed
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  // Check all faces
  for (const loc of region.faces()) {
    const [x, y] = grid.faceLoc(loc)
    const [width, height] = grid.faceBoundingBox()
    minX = Math.min(minX, x - width / 2)
    minY = Math.min(minY, y - height / 2)
    maxX = Math.max(maxX, x + width / 2)
    maxY = Math.max(maxY, y + height / 2)
  }

  // Add padding for the offset
  const padding = 20
  const offsetX = -minX + padding
  const offsetY = -minY + padding

  // Create a container div for the grid with explicit dimensions
  const gridContainer = document.createElement("div")
  gridContainer.className = "grid-container"
  gridContainer.style.width = `${maxX - minX + 2 * padding}px`
  gridContainer.style.height = `${maxY - minY + 2 * padding}px`
  leftPane.append(gridContainer)

  // Create render context
  const ctx: RenderContext = {
    grid,
    config,
    offsetX,
    offsetY,
    gridContainer,
    leftPane,
    debugTooltip
  }

  // Render all hexagons (faces) in green
  for (const loc of region.faces()) {
    renderLocation(ctx, loc, hexRenderer)
  }

  // Render all edges in black
  for (const edge of region.edges()) {
    renderLocation(ctx, edge, edgeRenderer)
  }

  // Render all vertices in yellow
  for (const vertex of region.vertices()) {
    renderLocation(ctx, vertex, vertexRenderer)
  }
}

/**
 * Adds debug hover functionality to an element, displaying the location's string
 * representation in a tooltip when the user hovers over the element.
 */
function addDebugHover<T extends { toString(): string }>(
  element: HTMLElement,
  location: T,
  debugTooltip: HTMLDivElement,
  leftPane: HTMLElement
) {
  element.addEventListener("mouseenter", () => {
    debugTooltip.textContent = location.toString()
    debugTooltip.style.display = "block"
  })

  element.addEventListener("mousemove", (e: MouseEvent) => {
    debugTooltip.style.left = `${e.pageX - leftPane.offsetLeft + 10}px`
    debugTooltip.style.top = `${e.pageY - leftPane.offsetTop + 10}px`
  })

  element.addEventListener("mouseleave", () => {
    debugTooltip.style.display = "none"
  })
}

/**
 * Interface for rendering different types of grid locations (hexes, edges, vertices).
 * Encapsulates all the type-specific rendering behavior and data access needed to
 * render a single location and its associated game elements.
 */
export interface LocationRenderer<T extends { toString(): string }, M extends LocMap<T, Item[]>> {
  /** Creates the visual shape element for this location type */
  createShape(grid: Grid, loc: T): HTMLElement
  /** Background color for this location type */
  backgroundColor: string
  /** Z-index for layering (hexes < edges < vertices) */
  zIndex: string
  /** Maximum number of game elements that can be placed at this location */
  maxElements: number
  /** Gets the element map for tracking game elements at locations of this type */
  getElementMap(config: GridConfig): M
  /** Gets the relative positions for arranging multiple game elements */
  getElementPositions(elementCount: number): [number, number][]
  /** Gets the function to calculate the screen position of this location */
  getPositionFn(): (g: Grid, l: T) => [number, number]
}

/** Renderer for hexagon (face) locations - green hexagons that can hold up to 6 elements */
const hexRenderer: LocationRenderer<FLoc, FLocMap<Item[]>> = {
  createShape: (grid: Grid, loc: FLoc) => newHexShape(grid, loc),
  backgroundColor: "green",
  zIndex: "0",
  maxElements: 6,
  getElementMap: (config: GridConfig) => config.hexElements,
  getElementPositions: (elementCount: number) => {
    // Position patterns for different hexagon element counts
    // Positions are relative offsets from center
    // Consistent spacing: 12px between element centers (4px gap between edges)
    const positions: [number, number][][] = [
      [], // 0 elements
      [[0, 0]], // 1 element: center
      [[-6, 0], [6, 0]], // 2 elements: horizontal line, 12px spacing
      [[-12, 0], [0, 0], [12, 0]], // 3 elements: horizontal line, 12px spacing
      [[-6, -6], [6, -6], [-6, 6], [6, 6]], // 4 elements: 2x2 grid, 12px spacing
      [[-12, -6], [0, -6], [12, -6], [-6, 6], [6, 6]], // 5 elements: 3 top, 2 bottom, 12px spacing
      [[-12, -6], [0, -6], [12, -6], [-12, 6], [0, 6], [12, 6]], // 6 elements: 2x3 grid, 12px spacing
    ]
    return positions[elementCount] || []
  },
  getPositionFn: () => (g: Grid, l: FLoc) => g.faceLoc(l)
}

/** Renderer for edge locations - black edges that can hold 1 element */
const edgeRenderer: LocationRenderer<ELoc, ELocMap<Item[]>> = {
  createShape: (grid: Grid, loc: ELoc) => newEdgeShape(grid, loc),
  backgroundColor: "black",
  zIndex: "1",
  maxElements: 1,
  getElementMap: (config: GridConfig) => config.edgeElements,
  getElementPositions: () => [[0, 0]],
  getPositionFn: () => (g: Grid, l: ELoc) => g.edgeLoc(l)
}

/** Renderer for vertex locations - yellow circles that can hold 1 element */
const vertexRenderer: LocationRenderer<VLoc, VLocMap<Item[]>> = {
  createShape: (grid: Grid, loc: VLoc) => newVertexShapeCirc(grid, loc),
  backgroundColor: "yellow",
  zIndex: "2",
  maxElements: 1,
  getElementMap: (config: GridConfig) => config.vertexElements,
  getElementPositions: () => [[0, 0]],
  getPositionFn: () => (g: Grid, l: VLoc) => g.vertexLoc(l)
}

/**
 * Shared rendering context passed to all location rendering calls.
 * Groups together all the common parameters needed for rendering to avoid
 * passing many individual parameters.
 */
interface RenderContext {
  grid: Grid
  config: GridConfig
  offsetX: number
  offsetY: number
  gridContainer: HTMLElement
  leftPane: HTMLElement
  debugTooltip: HTMLDivElement | null
}

/**
 * Renders a single grid location (hex, edge, or vertex) along with any game elements
 * placed at that location. Uses the provided renderer to handle type-specific behavior.
 *
 * This is the main rendering function that combines:
 * - Creating and styling the location shape
 * - Positioning it with offsets
 * - Adding interaction handlers (click, hover)
 * - Rendering game elements at the location
 */
function renderLocation<T extends { toString(): string }, M extends LocMap<T, Item[]>>(
  ctx: RenderContext,
  loc: T,
  renderer: LocationRenderer<T, M>
) {
  const { grid, config, offsetX, offsetY, gridContainer, leftPane, debugTooltip } = ctx
  const shape = renderer.createShape(grid, loc)
  shape.style.backgroundColor = renderer.backgroundColor
  shape.style.zIndex = renderer.zIndex

  // Apply offset to position
  const currentLeft = parseFloat(shape.style.left)
  const currentTop = parseFloat(shape.style.top)
  shape.style.left = `${currentLeft + offsetX}px`
  shape.style.top = `${currentTop + offsetY}px`

  // Add cursor style based on edit mode
  if (config.editMode === "add") {
    shape.style.cursor = "copy"
  } else if (config.editMode === "remove") {
    shape.style.cursor = "default"
  } else {
    shape.style.cursor = "default"
  }

  const elementMap = renderer.getElementMap(config)

  // Add click handler for adding entities
  if (config.editMode === "add") {
    shape.addEventListener("click", () => {
      const items = elementMap.getLoc(loc) || []
      if (items.length < renderer.maxElements) {
        elementMap.setLoc(loc, [...items, createItem(config.selectedItemType)])
        renderGrid(leftPane, config)
      }
    })
  }

  // Add hover debug info
  if (config.debugHover && debugTooltip) {
    addDebugHover(shape, loc, debugTooltip, leftPane)
  }

  gridContainer.append(shape)

  // Render elements at this location
  const items = elementMap.getLoc(loc) || []
  if (items.length > 0) {
    const positions = renderer.getElementPositions(items.length)
    const getPosition = renderer.getPositionFn()
    const [centerX, centerY] = getPosition(grid, loc)
    const elementSize = 8

    items.forEach((item, i) => {
      const [dx, dy] = positions[i]
      const x = centerX + dx + offsetX
      const y = centerY + dy + offsetY

      const element = document.createElement("div")
      element.className = "hex-element"
      element.style.left = `${x - elementSize / 2}px`
      element.style.top = `${y - elementSize / 2}px`
      element.style.backgroundColor = item.type.color
      element.style.border = "1px solid #333"

      // Add cursor style and click handler for remove mode
      if (config.editMode === "remove") {
        element.style.cursor = "not-allowed"
        element.style.pointerEvents = "auto"
        // Capture the item's unique ID
        const itemId = item.id
        element.addEventListener("click", (e) => {
          e.stopPropagation()
          const currentItems = elementMap.getLoc(loc) || []
          // Remove the item with the matching ID
          elementMap.setLoc(loc, currentItems.filter(it => it.id !== itemId))
          renderGrid(leftPane, config)
        })
      }

      gridContainer.append(element)
    })
  }
}
