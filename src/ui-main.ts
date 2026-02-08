import { Grid } from "./hex-grid.ts"
import { FLoc } from "./coord.ts"
import { newHexShape, newEdgeShape, newVertexShapeCirc } from "./shapes.ts"
import { RectangularRegion, HexagonalRegion, Region } from "./region.ts"
import type { Orientation } from "./coord.ts"

interface GridConfig {
  orientation: Orientation
  regionType: "rectangular" | "hexagonal"
  rectWidth: number
  rectHeight: number
  rectStartsWide: boolean
  hexRadius: number
}

function renderGrid(leftPane: HTMLElement, config: GridConfig) {
  // Clear the left pane and set up for absolute positioning
  leftPane.innerHTML = ""
  leftPane.style.position = "relative"

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

  // Render all hexagons (faces) in green
  for (const loc of region.faces()) {
    const hex = newHexShape(grid, loc)
    hex.style.backgroundColor = "green"
    hex.style.zIndex = "0"
    // Apply offset to position
    const currentLeft = parseFloat(hex.style.left)
    const currentTop = parseFloat(hex.style.top)
    hex.style.left = `${currentLeft + offsetX}px`
    hex.style.top = `${currentTop + offsetY}px`
    gridContainer.append(hex)
  }

  // Render all edges in black
  for (const edge of region.edges()) {
    const edgeShape = newEdgeShape(grid, edge)
    edgeShape.style.backgroundColor = "black"
    edgeShape.style.zIndex = "1"
    // Apply offset to position
    const currentLeft = parseFloat(edgeShape.style.left)
    const currentTop = parseFloat(edgeShape.style.top)
    edgeShape.style.left = `${currentLeft + offsetX}px`
    edgeShape.style.top = `${currentTop + offsetY}px`
    gridContainer.append(edgeShape)
  }

  // Render all vertices in yellow
  for (const vertex of region.vertices()) {
    const vertexShape = newVertexShapeCirc(grid, vertex)
    vertexShape.style.backgroundColor = "yellow"
    vertexShape.style.zIndex = "2"
    // Apply offset to position
    const currentLeft = parseFloat(vertexShape.style.left)
    const currentTop = parseFloat(vertexShape.style.top)
    vertexShape.style.left = `${currentLeft + offsetX}px`
    vertexShape.style.top = `${currentTop + offsetY}px`
    gridContainer.append(vertexShape)
  }
}

function createOrientationControl(config: GridConfig, updateGrid: () => void): HTMLElement {
  const orientationSection = document.createElement("div")
  orientationSection.className = "control-section"

  const orientationLabel = document.createElement("label")
  const orientationCheckbox = document.createElement("input")
  orientationCheckbox.type = "checkbox"
  orientationCheckbox.id = "orientation-checkbox"
  orientationCheckbox.checked = false // false = edge_up, true = vertex_up

  const orientationText = document.createElement("span")
  orientationText.textContent = " Vertex Up"

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

function createControls(leftPane: HTMLElement): HTMLElement {
  const controlsContainer = document.createElement("div")

  // Track current configuration
  const config: GridConfig = {
    orientation: "edge_up",
    regionType: "rectangular",
    rectWidth: 7,
    rectHeight: 10,
    rectStartsWide: true,
    hexRadius: 5
  }

  // Helper function to re-render grid
  const updateGrid = () => {
    renderGrid(leftPane, config)
  }

  // Add controls
  controlsContainer.appendChild(createOrientationControl(config, updateGrid))
  controlsContainer.appendChild(createRegionControl(config, updateGrid))

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
    hexRadius: 5
  }
  renderGrid(leftPane, initialConfig)

  // Create and add controls to right pane
  rightPane.innerHTML = ""
  const controls = createControls(leftPane)
  rightPane.appendChild(controls)
}

main()
