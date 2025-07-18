import { Rectangle, Cartesian3, Math as CesiumMath, Matrix4 } from 'cesium';

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
        if (geocoderService._lastResults && geocoderService._lastResults.length > 0) {
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
        const isSmallRectangle = Math.abs(destination.south - destination.north) < 0.0001 && 
                               Math.abs(destination.east - destination.west) < 0.0001;
        
        if (isSmallRectangle) {
            // Convert to center point with our altitude
            const center = Rectangle.center(destination);
            finalDestination = Cartesian3.fromDegrees(
                CesiumMath.toDegrees(center.longitude),
                CesiumMath.toDegrees(center.latitude),
                altitude // Use our altitude instead of default
            );
        } else {
            // For larger rectangles, we'll use the original logic but adjust the height
            // We'll need to compute the camera position for the rectangle and then adjust altitude
            const rectangleCenter = Rectangle.center(destination);
            finalDestination = Cartesian3.fromDegrees(
                CesiumMath.toDegrees(rectangleCenter.longitude),
                CesiumMath.toDegrees(rectangleCenter.latitude),
                altitude // Use our altitude
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