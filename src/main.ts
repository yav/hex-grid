import { renderGrid, type GridConfig, type Item, ITEM_TYPES } from "./grid-renderer.ts" 
import { FLocMap, ELocMap, VLocMap } from "./loc-map.ts"

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

function createItemTypeSelector(config: GridConfig, updateGrid: () => void): HTMLElement {
  const container = document.createElement("div")
  container.className = "control-section"
  container.style.marginBottom = "10px"

  const label = document.createElement("label")
  label.textContent = "Item Type:"
  container.appendChild(label)

  const radioGroup = document.createElement("div")
  radioGroup.style.marginTop = "8px"

  for (const itemType of ITEM_TYPES) {
    const radioLabel = document.createElement("label")
    radioLabel.style.display = "block"
    radioLabel.style.marginBottom = "3px"
    radioLabel.style.cursor = "pointer"

    const radio = document.createElement("input")
    radio.type = "radio"
    radio.name = "itemType"
    radio.value = itemType.id
    radio.checked = config.selectedItemType.id === itemType.id

    const colorIndicator = document.createElement("span")
    colorIndicator.className = "item-type-indicator"
    colorIndicator.style.backgroundColor = itemType.color

    radio.addEventListener("change", () => {
      config.selectedItemType = itemType
      updateGrid()
    })

    radioLabel.appendChild(radio)
    radioLabel.appendChild(document.createTextNode(" "))
    radioLabel.appendChild(colorIndicator)
    radioLabel.appendChild(document.createTextNode(itemType.displayName))
    radioGroup.appendChild(radioLabel)
  }

  container.appendChild(radioGroup)

  // Show only when in add mode
  container.style.display = config.editMode === "add" ? "block" : "none"

  return container
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

  // Create edit mode control
  const editModeControl = createEditModeControl(config, updateGrid)
  controlsContainer.appendChild(editModeControl)

  // Create item type selector
  const itemTypeSelector = createItemTypeSelector(config, updateGrid)
  controlsContainer.appendChild(itemTypeSelector)

  // Update edit mode control to toggle type selector visibility
  const editModeRadios = editModeControl.querySelectorAll('input[name="edit-mode"]')
  editModeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      itemTypeSelector.style.display = config.editMode === "add" ? "block" : "none"
    })
  })

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
    hexElements: new FLocMap<Item[]>(),
    edgeElements: new ELocMap<Item[]>(),
    vertexElements: new VLocMap<Item[]>(),
    editMode: "none",
    selectedItemType: ITEM_TYPES[0]  // Default to orange
  }
  renderGrid(leftPane, initialConfig)

  // Create and add controls to right pane
  rightPane.innerHTML = ""
  const controls = createControls(leftPane, initialConfig)
  rightPane.appendChild(controls)
}

main()
