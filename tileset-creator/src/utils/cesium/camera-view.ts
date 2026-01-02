import { Cartesian2, Cartesian3 } from "cesium";
import { Cartographic } from "cesium";
import { Viewer, Math as CesiumMath } from "cesium";
import type { Geometry } from "@openflam/dnsspatialdiscovery";

// This function calculates the screen rectangle based on the viewer's canvas size.
// The fractions specify how much of the screen to leave out on each side.
function getScreenRectangle(
  viewer: Viewer,
  fracsToLeave: {
    topFrac?: number;
    bottomFrac?: number;
    leftFrac?: number;
    rightFrac?: number;
  } = {},
): Cartesian2[] {
  const canvas = viewer.scene.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // Default fractions to leave out if not provided
  const defaultFrac = 0.4; // 40% by default
  let { topFrac, bottomFrac, leftFrac, rightFrac } = fracsToLeave;
  topFrac = topFrac ?? defaultFrac;
  bottomFrac = bottomFrac ?? defaultFrac;
  leftFrac = leftFrac ?? defaultFrac;
  rightFrac = rightFrac ?? defaultFrac;

  // Top two corners
  const topLeft = new Cartesian2(width * leftFrac, height * topFrac);
  const topRight = new Cartesian2(width * (1 - rightFrac), height * topFrac);
  // Bottom two corners
  const bottomLeft = new Cartesian2(
    width * leftFrac,
    height * (1 - bottomFrac),
  );
  const bottomRight = new Cartesian2(
    width * (1 - rightFrac),
    height * (1 - bottomFrac),
  );

  return [topLeft, topRight, bottomRight, bottomLeft];
}

function projectScreenRectangleToGlobe(
  viewer: Viewer,
  screenPoints: Cartesian2[],
): Geometry | null {
  const scene = viewer.scene;
  scene.pickTranslucentDepth = true; // Enables the ray to intersect with translucent objects.

  const getLonLat = (cartesian: Cartesian3) => {
    const carto = Cartographic.fromCartesian(cartesian);
    return [
      CesiumMath.toDegrees(carto.longitude),
      CesiumMath.toDegrees(carto.latitude),
    ];
  };

  const rectangleGeometry: Geometry = {
    type: "Polygon",
    coordinates: [[]],
  };
  for (const screenPt of screenPoints) {
    const cartesian = scene.pickPosition(screenPt);
    if (!cartesian) {
      console.warn(
        `Could not pick position for screen point: ${screenPt.x}, ${screenPt.y}`,
      );
      return null;
    }

    const lonLat = getLonLat(cartesian);
    rectangleGeometry.coordinates[0].push(lonLat);
  }
  // Close the polygon by adding the first point again
  rectangleGeometry.coordinates[0].push(rectangleGeometry.coordinates[0][0]);
  scene.pickTranslucentDepth = false; // Disable translucent depth picking.
  return rectangleGeometry;
}

function getPolygonFromViewer(viewer: Viewer): Geometry | null {
  const screenPoints = getScreenRectangle(viewer);
  const rectangleGeometry = projectScreenRectangleToGlobe(viewer, screenPoints);
  return rectangleGeometry;
}

/**
 * Get a position in front of the camera at a specified distance.
 * Useful for placing new objects where the user is looking.
 * @param viewer - The Cesium Viewer
 * @param distance - Distance in meters in front of the camera (default: 10)
 * @returns Object with cartesian position and cartographic coordinates (lat/lon/alt in degrees/meters)
 */
function getPositionInFrontOfCamera(
  viewer: Viewer,
  distance: number = 10.0
): {
  position: Cartesian3;
  latitude: number;
  longitude: number;
  altitude: number;
} {
  const camera = viewer.scene.camera;
  const cameraPosition = camera.positionWC;
  const cameraDirection = camera.directionWC;

  // Calculate position at specified distance in front of camera
  const offset = Cartesian3.multiplyByScalar(
    cameraDirection,
    distance,
    new Cartesian3()
  );
  const position = Cartesian3.add(
    cameraPosition,
    offset,
    new Cartesian3()
  );

  // Convert to cartographic for lat/lon/alt
  const cartographic = Cartographic.fromCartesian(position);

  return {
    position,
    latitude: CesiumMath.toDegrees(cartographic.latitude),
    longitude: CesiumMath.toDegrees(cartographic.longitude),
    altitude: cartographic.height,
  };
}

export { getPolygonFromViewer, getPositionInFrontOfCamera };
