import {
  Rectangle,
  Cartesian3,
  Math as CesiumMath,
  Matrix4,
  Viewer,
} from "cesium";

/**
 * Custom destinationFound function that handles altitude from geocoder results.
 * This function overrides the default Cesium geocoder behavior to use altitude
 * data from our custom Nominatim geocoder service.
 *
 * @param viewModel - The geocoder view model
 * @param destination - The destination (Rectangle or Cartesian3)
 */
export function customDestinationFound(viewModel: any, destination: any): void {
  // Try to get altitude from the geocoder service
  let altitude = 1000; // Default altitude if we can't find it

  // Check if we can access the last geocoder results
  if (viewModel._geocoderServices && viewModel._geocoderServices.length > 0) {
    const geocoderService = viewModel._geocoderServices[0];

    // Try to get altitude from the service if it has stored results
    if (
      geocoderService._lastResults &&
      geocoderService._lastResults.length > 0
    ) {
      const lastResult = geocoderService._lastResults[0];
      if (lastResult.altitude !== undefined) {
        altitude = lastResult.altitude;
      }
    }
  }

  const scene = viewModel._scene;
  const camera = scene.camera;
  let finalDestination = destination;

  if (destination instanceof Rectangle) {
    // Check if rectangle is very small (like a point)
    const isSmallRectangle =
      Math.abs(destination.south - destination.north) < 0.0001 &&
      Math.abs(destination.east - destination.west) < 0.0001;

    if (isSmallRectangle) {
      // Convert to center point with our altitude
      const center = Rectangle.center(destination);
      finalDestination = Cartesian3.fromDegrees(
        CesiumMath.toDegrees(center.longitude),
        CesiumMath.toDegrees(center.latitude),
        altitude, // Use our altitude instead of default
      );
    } else {
      // For larger rectangles, we'll use the original logic but adjust the height
      // We'll need to compute the camera position for the rectangle and then adjust altitude
      const rectangleCenter = Rectangle.center(destination);
      finalDestination = Cartesian3.fromDegrees(
        CesiumMath.toDegrees(rectangleCenter.longitude),
        CesiumMath.toDegrees(rectangleCenter.latitude),
        altitude, // Use our altitude
      );
    }
  }

  // Fly to the destination with our custom altitude
  camera.flyTo({
    destination: finalDestination,
    complete: function () {
      viewModel._complete.raiseEvent();
    },
    duration: viewModel._flightDuration,
    endTransform: Matrix4.IDENTITY,
  });
}

/**
 * New function to handle combined search results from our custom search service.
 * This function works with the SearchResult interface from CombinedSearchService.
 *
 * @param result - The search result from CombinedSearchService
 * @param viewer - The Cesium viewer instance
 */
export function flyToSearchResult(result: any, viewer: Viewer): void {
  console.log("🗺️ Starting flyToSearchResult:", {
    displayName: result.displayName,
    source: result.source,
    altitude: result.altitude,
    hasDestination: !!result.destination,
    timestamp: new Date().toISOString(),
  });

  // Guard against using destroyed viewer/scene
  if (
    !viewer ||
    (typeof (viewer as any).isDestroyed === "function" &&
      (viewer as any).isDestroyed())
  ) {
    console.error("❌ flyToSearchResult: Viewer unavailable or destroyed");
    return;
  }

  const scene: any = (viewer as any).scene;
  if (
    !scene ||
    (typeof scene.isDestroyed === "function" && scene.isDestroyed())
  ) {
    console.error("❌ flyToSearchResult: Scene unavailable or destroyed");
    return;
  }

  const camera = viewer.camera;
  let finalDestination = result.destination;
  const altitude = result.altitude || 1000; // Use result altitude or default

  console.log("📍 Processing destination:", {
    originalDestination: result.destination,
    altitude: altitude,
    isRectangle: result.destination instanceof Rectangle,
  });

  if (result.destination instanceof Rectangle) {
    const rect = result.destination;
    // Check if rectangle is very small (like a point)
    const isSmallRectangle =
      Math.abs(rect.south - rect.north) < 0.0001 &&
      Math.abs(rect.east - rect.west) < 0.0001;

    console.log("📐 Rectangle analysis:", {
      bounds: {
        south: CesiumMath.toDegrees(rect.south),
        north: CesiumMath.toDegrees(rect.north),
        east: CesiumMath.toDegrees(rect.east),
        west: CesiumMath.toDegrees(rect.west),
      },
      isSmallRectangle: isSmallRectangle,
      heightDiff: Math.abs(rect.south - rect.north),
      widthDiff: Math.abs(rect.east - rect.west),
    });

    if (isSmallRectangle) {
      // Convert to center point with our altitude
      const center = Rectangle.center(rect);
      finalDestination = Cartesian3.fromDegrees(
        CesiumMath.toDegrees(center.longitude),
        CesiumMath.toDegrees(center.latitude),
        altitude,
      );
      console.log("📌 Using point destination (small rectangle):", {
        longitude: CesiumMath.toDegrees(center.longitude),
        latitude: CesiumMath.toDegrees(center.latitude),
        altitude: altitude,
      });
    } else {
      // For larger rectangles, use the center with our altitude
      const rectangleCenter = Rectangle.center(rect);
      finalDestination = Cartesian3.fromDegrees(
        CesiumMath.toDegrees(rectangleCenter.longitude),
        CesiumMath.toDegrees(rectangleCenter.latitude),
        altitude,
      );
      console.log("📌 Using center destination (large rectangle):", {
        longitude: CesiumMath.toDegrees(rectangleCenter.longitude),
        latitude: CesiumMath.toDegrees(rectangleCenter.latitude),
        altitude: altitude,
      });
    }
  }

  // Fly to the destination
  const startTime = Date.now();
  try {
    console.log("🚀 Initiating standard search result flight:", {
      destination: finalDestination,
      duration: "2.0s",
    });

    camera.flyTo({
      destination: finalDestination,
      duration: 2.0,
      complete: () => {
        const flightTime = Date.now() - startTime;
        console.log("✅ Standard search result flight completed:", {
          result: result.displayName,
          actualDuration: `${flightTime}ms`,
          expectedDuration: "2000ms",
        });
      },
      cancel: () => {
        const flightTime = Date.now() - startTime;
        console.warn("⚠️ Standard search result flight cancelled:", {
          result: result.displayName,
          partialDuration: `${flightTime}ms`,
        });
      },
    });
  } catch (error) {
    console.error("❌ flyToSearchResult camera flyTo error:", {
      error: error,
      result: result.displayName,
      destination: finalDestination,
    });
  }
}
