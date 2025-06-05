import { Cartesian2, Cartesian3 } from "cesium";
import { Cartographic } from "cesium";
import { Viewer, Math as CesiumMath } from "cesium";
import type { Geometry } from "@openflam/dnsspatialdiscovery";

// This function calculates the screen rectangle based on the viewer's canvas size.
// The fractions specify how much of the screen to leave out on each side.
function getScreenRectangle(
    viewer: Viewer,
    fracsToLeave: {
        topFrac?: number,
        bottomFrac?: number,
        leftFrac?: number,
        rightFrac?: number
    } = {}
): Cartesian2[] {
    const canvas = viewer.scene.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // Default fractions to leave out if not provided
    const defaultFrac = 0.1; // 40% by default
    let { topFrac, bottomFrac, leftFrac, rightFrac } = fracsToLeave;
    topFrac = topFrac ?? defaultFrac;
    bottomFrac = bottomFrac ?? defaultFrac;
    leftFrac = leftFrac ?? defaultFrac;
    rightFrac = rightFrac ?? defaultFrac;

    // Top two corners
    const topLeft = new Cartesian2(width * leftFrac, height * topFrac);
    const topRight = new Cartesian2(width * (1 - rightFrac), height * topFrac);
    // Bottom two corners
    const bottomLeft = new Cartesian2(width * leftFrac, height * (1 - bottomFrac));
    const bottomRight = new Cartesian2(width * (1 - rightFrac), height * (1 - bottomFrac));

    return [topLeft, topRight, bottomRight, bottomLeft];
}

function projectScreenRectangleToGlobe(viewer: Viewer, screenPoints: Cartesian2[]): Geometry | null {
    const scene = viewer.scene;
    scene.pickTranslucentDepth = true; // Enables the ray to intersect with translucent objects.

    const getLonLat = (cartesian: Cartesian3) => {
        const carto = Cartographic.fromCartesian(cartesian);
        return [
            CesiumMath.toDegrees(carto.longitude),
            CesiumMath.toDegrees(carto.latitude)
        ];
    }

    const rectangleGeometry: Geometry = {
        type: 'Polygon',
        coordinates: [[]]
    };
    for (const screenPt of screenPoints) {
        const cartesian = scene.pickPosition(screenPt);
        if (!cartesian) {
            console.warn(`Could not pick position for screen point: ${screenPt.x}, ${screenPt.y}`);
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
};

export { getPolygonFromViewer };