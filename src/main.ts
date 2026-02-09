import { Grid } from "./hex-grid.ts"
import { FLoc, ELoc, VLoc } from "./coord.ts"
import { newHexShape, newEdgeShape, newVertexShapeCirc } from "./shapes.ts"
import { RectangularRegion, HexagonalRegion, Region } from "./region.ts"
import { FLocMap, ELocMap, VLocMap, type LocMap } from "./loc-map.ts"
import type { Orientation } from "./coord.ts"

interface GridConfig {
  orientation: Orientation
  regionType: "rectangular" | "hexagonal"
  rectWidth: number
  rectHeight: number
  rectStartsWide: boolean
  hexRadius: number
  debugHover: boolean
  hexElements: FLocMap<number> // Maps hexagon locations to element counts (0-6)
  edgeElements: ELocMap<number> // Maps edge locations to element counts (0-1)
  vertexElements: VLocMap<number> // Maps vertex locations to element counts (0-1)
  editMode: "none" | "add" | "remove"
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
 * Creates game element boxes (small squares) at specified positions relative to a location.
 * Used to render resource tokens, pieces, or other game elements on hexes, edges, and vertices.
 */
function createElements<T>(
  grid: Grid,
  loc: T,
  positions: [number, number][],
  offsetX: number,
  offsetY: number,
  config: GridConfig,
  getPosition: (grid: Grid, loc: T) => [number, number],
  onRemove: () => void
): HTMLElement[] {
  const elements: HTMLElement[] = []
  const [centerX, centerY] = getPosition(grid, loc)
  const elementSize = 8

  for (const [dx, dy] of positions) {
    const x = centerX + dx + offsetX
    const y = centerY + dy + offsetY

    const element = document.createElement("div")
    element.className = "hex-element"
    element.style.left = `${x - elementSize / 2}px`
    element.style.top = `${y - elementSize / 2}px`

    // Add cursor style and click handler for remove mode
    if (config.editMode === "remove") {
      element.style.cursor = "not-allowed"
      element.style.pointerEvents = "auto"
      element.addEventListener("click", (e) => {
        e.stopPropagation()
        onRemove()
      })
    }

    elements.push(element)
  }

  return elements
}

/**
 * Interface for rendering different types of grid locations (hexes, edges, vertices).
 * Encapsulates all the type-specific rendering behavior and data access needed to
 * render a single location and its associated game elements.
 */
interface LocationRenderer<T extends { toString(): string }, M extends LocMap<T, number>> {
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
const hexRenderer: LocationRenderer<FLoc, FLocMap<number>> = {
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
const edgeRenderer: LocationRenderer<ELoc, ELocMap<number>> = {
  createShape: (grid: Grid, loc: ELoc) => newEdgeShape(grid, loc),
  backgroundColor: "black",
  zIndex: "1",
  maxElements: 1,
  getElementMap: (config: GridConfig) => config.edgeElements,
  getElementPositions: () => [[0, 0]],
  getPositionFn: () => (g: Grid, l: ELoc) => g.edgeLoc(l)
}

/** Renderer for vertex locations - yellow circles that can hold 1 element */
const vertexRenderer: LocationRenderer<VLoc, VLocMap<number>> = {
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
function renderLocation<T extends { toString(): string }, M extends LocMap<T, number>>(
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
      const currentCount = elementMap.getLoc(loc) || 0
      if (currentCount < renderer.maxElements) {
        elementMap.setLoc(loc, currentCount + 1)
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
  const elementCount = elementMap.getLoc(loc) || 0
  if (elementCount > 0) {
    const elements = createElements(
      grid,
      loc,
      renderer.getElementPositions(elementCount),
      offsetX,
      offsetY,
      config,
      renderer.getPositionFn(),
      () => {
        const currentCount = elementMap.getLoc(loc) || 0
        if (currentCount > 0) {
          elementMap.setLoc(loc, currentCount - 1)
          renderGrid(leftPane, config)
        }
      }
    )
    for (const element of elements) {
      gridContainer.append(element)
    }
  }
}

function renderGrid(leftPane: HTMLElement, config: GridConfig) {
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

function createDebugHoverControl(config: GridConfig, updateGrid: () => void): HTMLElement {
  const debugSection = document.createElement("div")
  debugSection.className = "control-section-inline"

  const debugLabel = document.createElement("label")
  const debugCheckbox = document.createElement("input")
  debugCheckbox.type = "checkbox"
  debugCheckbox.id = "debug-hover-checkbox"
  debugCheckbox.checked = config.debugHover

  const debugText = document.createElement("span")
  debugText.textContent = "Debug Hover"

  debugLabel.appendChild(debugCheckbox)
  debugLabel.appendChild(debugText)

  debugCheckbox.addEventListener("change", () => {
    config.debugHover = debugCheckbox.checked
    updateGrid()
  })

  debugSection.appendChild(debugLabel)
  return debugSection
}

function createEditModeControl(config: GridConfig, updateGrid: () => void): HTMLElement {
  const editSection = document.createElement("div")
  editSection.className = "control-section"

  const editLabel = document.createElement("label")
  editLabel.textContent = "Edit Mode:"
  editSection.appendChild(editLabel)

  // Create container for radio buttons (inline row)
  const radioContainer = document.createElement("div")
  radioContainer.className = "radio-group"

  // Create radio button for "None"
  const noneLabel = document.createElement("label")
  noneLabel.className = "radio-label"
  const noneRadio = document.createElement("input")
  noneRadio.type = "radio"
  noneRadio.name = "edit-mode"
  noneRadio.value = "none"
  noneRadio.checked = config.editMode === "none"
  const noneText = document.createElement("span")
  noneText.textContent = "None"
  noneLabel.appendChild(noneRadio)
  noneLabel.appendChild(noneText)
  radioContainer.appendChild(noneLabel)

  // Create radio button for "Add"
  const addLabel = document.createElement("label")
  addLabel.className = "radio-label"
  const addRadio = document.createElement("input")
  addRadio.type = "radio"
  addRadio.name = "edit-mode"
  addRadio.value = "add"
  addRadio.checked = config.editMode === "add"
  const addText = document.createElement("span")
  addText.textContent = "Add"
  addLabel.appendChild(addRadio)
  addLabel.appendChild(addText)
  radioContainer.appendChild(addLabel)

  // Create radio button for "Remove"
  const removeLabel = document.createElement("label")
  removeLabel.className = "radio-label"
  const removeRadio = document.createElement("input")
  removeRadio.type = "radio"
  removeRadio.name = "edit-mode"
  removeRadio.value = "remove"
  removeRadio.checked = config.editMode === "remove"
  const removeText = document.createElement("span")
  removeText.textContent = "Remove"
  removeLabel.appendChild(removeRadio)
  removeLabel.appendChild(removeText)
  radioContainer.appendChild(removeLabel)

  editSection.appendChild(radioContainer)

  // Add event listeners
  const updateEditMode = (mode: "none" | "add" | "remove") => {
    config.editMode = mode
    updateGrid()
  }

  noneRadio.addEventListener("change", () => updateEditMode("none"))
  addRadio.addEventListener("change", () => updateEditMode("add"))
  removeRadio.addEventListener("change", () => updateEditMode("remove"))

  return editSection
}

function createOrientationControl(config: GridConfig, updateGrid: () => void): HTMLElement {
  const orientationSection = document.createElement("div")
  orientationSection.className = "control-section-inline"

  const orientationLabel = document.createElement("label")
  const orientationCheckbox = document.createElement("input")
  orientationCheckbox.type = "checkbox"
  orientationCheckbox.id = "orientation-checkbox"
  orientationCheckbox.checked = false // false = edge_up, true = vertex_up

  const orientationText = document.createElement("span")
  orientationText.textContent = "Vertex Up"

  orientationLabel.appendChild(orientationCheckbox)
  orientationLabel.appendChild(orientationText)

  orientationCheckbox.addEventListener("change", () => {
    config.orientation = orientationCheckbox.checked ? "vertex_up" : "edge_up"
    updateGrid()
  })

  orientationSection.appendChild(orientationLabel)
  return orientationSection
}

function createRegionControl(config: GridConfig, updateGrid: () => void): HTMLElement {
  const container = document.createElement("div")

  // Create region type selector
  const regionSection = document.createElement("div")
  regionSection.className = "control-section"

  const regionTypeLabel = document.createElement("label")
  regionTypeLabel.textContent = "Region Type:"

  const regionTypeSelect = document.createElement("select")
  regionTypeSelect.id = "region-type-select"

  const rectOption = document.createElement("option")
  rectOption.value = "rectangular"
  rectOption.textContent = "Rectangular"

  const hexOption = document.createElement("option")
  hexOption.value = "hexagonal"
  hexOption.textContent = "Hexagonal"

  regionTypeSelect.appendChild(rectOption)
  regionTypeSelect.appendChild(hexOption)

  regionSection.appendChild(regionTypeLabel)
  regionSection.appendChild(regionTypeSelect)
  container.appendChild(regionSection)

  // Rectangular region controls
  const rectSection = document.createElement("div")
  rectSection.className = "control-section"
  rectSection.id = "rect-controls"

  const rectWidthLabel = document.createElement("label")
  rectWidthLabel.textContent = `Width: ${config.rectWidth}`
  const rectWidthInput = document.createElement("input")
  rectWidthInput.type = "range"
  rectWidthInput.min = "1"
  rectWidthInput.max = "20"
  rectWidthInput.value = String(config.rectWidth)
  rectWidthInput.addEventListener("input", () => {
    config.rectWidth = parseInt(rectWidthInput.value)
    rectWidthLabel.textContent = `Width: ${config.rectWidth}`
    updateGrid()
  })

  const rectHeightLabel = document.createElement("label")
  rectHeightLabel.textContent = `Height: ${config.rectHeight}`
  const rectHeightInput = document.createElement("input")
  rectHeightInput.type = "range"
  rectHeightInput.min = "1"
  rectHeightInput.max = "20"
  rectHeightInput.value = String(config.rectHeight)
  rectHeightInput.addEventListener("input", () => {
    config.rectHeight = parseInt(rectHeightInput.value)
    rectHeightLabel.textContent = `Height: ${config.rectHeight}`
    updateGrid()
  })

  const rectStartsWideLabel = document.createElement("label")
  const rectStartsWideCheckbox = document.createElement("input")
  rectStartsWideCheckbox.type = "checkbox"
  rectStartsWideCheckbox.checked = config.rectStartsWide
  rectStartsWideCheckbox.addEventListener("change", () => {
    config.rectStartsWide = rectStartsWideCheckbox.checked
    updateGrid()
  })
  const rectStartsWideText = document.createElement("span")
  rectStartsWideText.textContent = " Starts Wide"
  rectStartsWideLabel.appendChild(rectStartsWideCheckbox)
  rectStartsWideLabel.appendChild(rectStartsWideText)

  rectSection.appendChild(rectWidthLabel)
  rectSection.appendChild(rectWidthInput)
  rectSection.appendChild(document.createElement("br"))
  rectSection.appendChild(rectHeightLabel)
  rectSection.appendChild(rectHeightInput)
  rectSection.appendChild(document.createElement("br"))
  rectSection.appendChild(rectStartsWideLabel)
  container.appendChild(rectSection)

  // Hexagonal region controls
  const hexSection = document.createElement("div")
  hexSection.className = "control-section"
  hexSection.id = "hex-controls"
  hexSection.style.display = "none" // Initially hidden

  const hexRadiusLabel = document.createElement("label")
  hexRadiusLabel.textContent = `Radius: ${config.hexRadius}`
  const hexRadiusInput = document.createElement("input")
  hexRadiusInput.type = "range"
  hexRadiusInput.min = "1"
  hexRadiusInput.max = "15"
  hexRadiusInput.value = String(config.hexRadius)
  hexRadiusInput.addEventListener("input", () => {
    config.hexRadius = parseInt(hexRadiusInput.value)
    hexRadiusLabel.textContent = `Radius: ${config.hexRadius}`
    updateGrid()
  })

  hexSection.appendChild(hexRadiusLabel)
  hexSection.appendChild(hexRadiusInput)
  container.appendChild(hexSection)

  // Region type change handler
  regionTypeSelect.addEventListener("change", () => {
    config.regionType = regionTypeSelect.value as "rectangular" | "hexagonal"

    if (config.regionType === "rectangular") {
      rectSection.style.display = "block"
      hexSection.style.display = "none"
    } else {
      rectSection.style.display = "none"
      hexSection.style.display = "block"
    }

    updateGrid()
  })

  return container
}

function createControls(leftPane: HTMLElement, config: GridConfig): HTMLElement {
  const controlsContainer = document.createElement("div")

  // Helper function to re-render grid
  const updateGrid = () => {
    renderGrid(leftPane, config)
  }

  // Add controls - top row with orientation and debug hover
  const topRow = document.createElement("div")
  topRow.className = "controls-top-row"
  topRow.appendChild(createOrientationControl(config, updateGrid))
  topRow.appendChild(createDebugHoverControl(config, updateGrid))
  controlsContainer.appendChild(topRow)

  controlsContainer.appendChild(createRegionControl(config, updateGrid))
  controlsContainer.appendChild(createEditModeControl(config, updateGrid))

  return controlsContainer
}

function main() {
  const leftPane = document.getElementById("left-pane")
  const rightPane = document.getElementById("right-pane")

  if (!leftPane || !rightPane) return

  // Render initial grid
  const initialConfig: GridConfig = {
    orientation: "edge_up",
    regionType: "rectangular",
    rectWidth: 7,
    rectHeight: 10,
    rectStartsWide: true,
    hexRadius: 5,
    debugHover: false,
    hexElements: new FLocMap<number>(),
    edgeElements: new ELocMap<number>(),
    vertexElements: new VLocMap<number>(),
    editMode: "none"
  }

  // Add some test elements to hexagons
  // For edge_up rectangular region starting at (0,0): column 0 has y=0, column 1 has y=-1
  initialConfig.hexElements.setLoc(new FLoc(0, 0), 3)
  initialConfig.hexElements.setLoc(new FLoc(1, 0), 1)
  initialConfig.hexElements.setLoc(new FLoc(2, 0), 6)
  initialConfig.hexElements.setLoc(new FLoc(3, 0), 4)
  initialConfig.hexElements.setLoc(new FLoc(9, -1), 2)
  initialConfig.hexElements.setLoc(new FLoc(8, -1), 5)

  renderGrid(leftPane, initialConfig)

  // Create and add controls to right pane
  rightPane.innerHTML = ""
  const controls = createControls(leftPane, initialConfig)
  rightPane.appendChild(controls)
}

main()
