import { Viewer, Math as CesiumMath, Cartesian3, Rectangle } from "cesium";

export interface CameraViewData {
  type: "CameraView";
  position: {
    longitude: number;
    latitude: number;
    height: number;
  };
  orientation: {
    heading: number;
    pitch: number;
    roll: number;
  };
  boundingBox: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  timestamp: string;
  description?: string;
}

/**
 * Fly the camera to a specific view defined by camera data
 */
export function flyToCameraView(
  viewer: Viewer,
  viewData: CameraViewData,
  duration: number = 2.0,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log("📹 Starting flyToCameraView:", {
        viewType: viewData.type,
        position: viewData.position,
        orientation: viewData.orientation,
        duration: duration,
        description: viewData.description || "No description",
      });

      if (!viewData.position || !viewData.orientation) {
        const error = new Error(
          "Invalid camera view data: missing position or orientation",
        );
        console.error("❌ flyToCameraView validation failed:", error.message);
        reject(error);
        return;
      }

      const destination = Cartesian3.fromDegrees(
        viewData.position.longitude,
        viewData.position.latitude,
        viewData.position.height,
      );

      console.log("🚀 Initiating camera flight:", {
        destination: {
          longitude: viewData.position.longitude,
          latitude: viewData.position.latitude,
          height: viewData.position.height,
        },
        orientation: {
          heading: `${viewData.orientation.heading}° (${CesiumMath.toRadians(viewData.orientation.heading)} rad)`,
          pitch: `${viewData.orientation.pitch}° (${CesiumMath.toRadians(viewData.orientation.pitch)} rad)`,
          roll: `${viewData.orientation.roll}° (${CesiumMath.toRadians(viewData.orientation.roll)} rad)`,
        },
        duration: `${duration}s`,
      });

      const startTime = Date.now();

      viewer.camera.flyTo({
        destination,
        orientation: {
          heading: CesiumMath.toRadians(viewData.orientation.heading),
          pitch: CesiumMath.toRadians(viewData.orientation.pitch),
          roll: CesiumMath.toRadians(viewData.orientation.roll),
        },
        duration,
        complete: () => {
          const flightTime = Date.now() - startTime;
          console.log("✅ Camera flight completed successfully:", {
            actualDuration: `${flightTime}ms`,
            expectedDuration: `${duration * 1000}ms`,
            finalPosition: viewData.position,
            finalOrientation: viewData.orientation,
          });
          resolve();
        },
        cancel: () => {
          const flightTime = Date.now() - startTime;
          const error = new Error("Camera flight was cancelled");
          console.warn("⚠️ Camera flight was cancelled:", {
            partialDuration: `${flightTime}ms`,
            expectedDuration: `${duration * 1000}ms`,
            targetPosition: viewData.position,
          });
          reject(error);
        },
      });
    } catch (error) {
      console.error("❌ flyToCameraView error:", {
        error: error,
        viewData: viewData,
        duration: duration,
      });
      reject(error);
    }
  });
}

/**
 * Fly the camera to show a specific bounding box
 */
export function flyToBoundingBox(
  viewer: Viewer,
  boundingBox: { west: number; south: number; east: number; north: number },
  duration: number = 2.0,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const rectangle = Rectangle.fromDegrees(
        boundingBox.west,
        boundingBox.south,
        boundingBox.east,
        boundingBox.north,
      );

      viewer.camera.flyTo({
        destination: rectangle,
        duration,
        complete: () => resolve(),
        cancel: () => reject(new Error("Camera flight was cancelled")),
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Fly the camera to a specific location with a default viewing angle
 */
export function flyToLocation(
  viewer: Viewer,
  longitude: number,
  latitude: number,
  height: number = 1000,
  heading: number = 0,
  pitch: number = -45,
  roll: number = 0,
  duration: number = 2.0,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const destination = Cartesian3.fromDegrees(longitude, latitude, height);

      viewer.camera.flyTo({
        destination,
        orientation: {
          heading: CesiumMath.toRadians(heading),
          pitch: CesiumMath.toRadians(pitch),
          roll: CesiumMath.toRadians(roll),
        },
        duration,
        complete: () => resolve(),
        cancel: () => reject(new Error("Camera flight was cancelled")),
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get current camera view data
 */
export function getCurrentCameraView(
  viewer: Viewer,
  description?: string,
): CameraViewData | null {
  try {
    const camera = viewer.camera;
    const scene = viewer.scene;

    // Get camera position
    const cameraPosition = camera.positionCartographic;

    // Get camera orientation
    const heading = CesiumMath.toDegrees(camera.heading);
    const pitch = CesiumMath.toDegrees(camera.pitch);
    const roll = CesiumMath.toDegrees(camera.roll);

    // Calculate visible bounding box
    const canvas = scene.canvas;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Get corners of the screen
    const topLeft = camera.pickEllipsoid(
      new Cartesian3(0, 0, 0),
      scene.globe.ellipsoid,
    );
    const topRight = camera.pickEllipsoid(
      new Cartesian3(width, 0, 0),
      scene.globe.ellipsoid,
    );
    const bottomLeft = camera.pickEllipsoid(
      new Cartesian3(0, height, 0),
      scene.globe.ellipsoid,
    );
    const bottomRight = camera.pickEllipsoid(
      new Cartesian3(width, height, 0),
      scene.globe.ellipsoid,
    );

    let boundingBox = {
      west: -180,
      south: -90,
      east: 180,
      north: 90,
    };

    // If we can pick points on the ellipsoid, calculate actual bounds
    const corners = [topLeft, topRight, bottomLeft, bottomRight].filter(
      (corner) => corner !== undefined,
    );
    if (corners.length > 0) {
      const cartographics = corners.map((corner) =>
        scene.globe.ellipsoid.cartesianToCartographic(corner!),
      );
      const longitudes = cartographics.map((c) =>
        CesiumMath.toDegrees(c.longitude),
      );
      const latitudes = cartographics.map((c) =>
        CesiumMath.toDegrees(c.latitude),
      );

      boundingBox = {
        west: Math.min(...longitudes),
        south: Math.min(...latitudes),
        east: Math.max(...longitudes),
        north: Math.max(...latitudes),
      };
    }

    return {
      type: "CameraView",
      position: {
        longitude: CesiumMath.toDegrees(cameraPosition.longitude),
        latitude: CesiumMath.toDegrees(cameraPosition.latitude),
        height: cameraPosition.height,
      },
      orientation: {
        heading,
        pitch,
        roll,
      },
      boundingBox,
      timestamp: new Date().toISOString(),
      description,
    };
  } catch (error) {
    console.error("Error getting current camera view:", error);
    return null;
  }
}

/**
 * Parse camera view data from JSON string
 */
export function parseCameraViewData(jsonString: string): CameraViewData {
  const data = JSON.parse(jsonString);

  if (data.type !== "CameraView") {
    throw new Error("Invalid data type. Expected CameraView.");
  }

  if (!data.position || !data.orientation) {
    throw new Error("Invalid camera view data: missing required fields");
  }

  return data as CameraViewData;
}

/**
 * Format camera view data as a readable string
 */
export function formatCameraViewData(viewData: CameraViewData): string {
  return JSON.stringify(viewData, null, 2);
}
