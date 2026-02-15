// Coordinate types and utilities
export {
  Dir,
  FLoc,
  ELoc,
  DELoc,
  VLoc,
  edgeDir,
  directions,
  otherOrientation,
} from "./coord.ts"

export type { Orientation, DirName } from "./coord.ts"

// Grid layout and transformations
export { Grid } from "./hex-grid.ts"

// Location maps
export {
  FLocMap,
  ELocMap,
  DELocMap,
  VLocMap,
  FilteredLocMap,
} from "./loc-map.ts"

export type { LocMap } from "./loc-map.ts"

// Region types
export {
  Region,
  RectangularRegion,
  HexagonalRegion,
} from "./region.ts"

// Shape rendering utilities
export {
  newHexShape,
  newEdgeShape,
  newVertexShapeCirc,
} from "./shapes.ts"
