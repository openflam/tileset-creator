import { useState, useRef, useCallback, useEffect } from "react";
import {
  Viewer,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Color,
  CallbackProperty,
  Entity,
  PolygonHierarchy,
} from "cesium";

interface CornerPosition {
  longitude: number;
  latitude: number;
  height: number;
}

const DEG_TO_METERS_LAT = 111000;
const degToMetersLon = (lat: number) =>
  111000 * Math.cos((lat * Math.PI) / 180);

export interface BboxResult {
  corners: { longitude: number; latitude: number }[];
  west: number;
  south: number;
  east: number;
  north: number;
  height: number;
  roomHeight: number;
  widthMeters: number;
  depthMeters: number;
  center: { longitude: number; latitude: number; height: number };
}

export type DrawingPhase = "idle" | "drawing" | "complete";

export function useBboxDrawing(viewer: Viewer | null) {
  const [drawingPhase, setDrawingPhase] = useState<DrawingPhase>("idle");
  const [bboxResult, setBboxResult] = useState<BboxResult | null>(null);
  const [cornersCount, setCornersCount] = useState(0);

  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const drawingCornersRef = useRef<CornerPosition[]>([]);
  const previewEntityRef = useRef<Entity | null>(null);
  const mousePosRef = useRef<{ longitude: number; latitude: number } | null>(
    null,
  );
  const roomHeightRef = useRef(3);
  const baseHeightRef = useRef(0);

  const centerLonRef = useRef(0);
  const centerLatRef = useRef(0);
  const offsetsRef = useRef<{ dlon: number; dlat: number }[]>([]);
  const scaleXRef = useRef(1);
  const scaleYRef = useRef(1);
  const initialWidthRef = useRef(0);
  const initialDepthRef = useRef(0);
  const completedRef = useRef(false);

  const pickCartographic = useCallback(
    (screenPos: Cartesian2): CornerPosition | null => {
      if (!viewer) return null;

      if (viewer.scene.pickPositionSupported) {
        const cartesian = viewer.scene.pickPosition(screenPos);
        if (cartesian) {
          const carto = Cartographic.fromCartesian(cartesian);
          if (carto) {
            return {
              longitude: CesiumMath.toDegrees(carto.longitude),
              latitude: CesiumMath.toDegrees(carto.latitude),
              height: carto.height,
            };
          }
        }
      }

      const ray = viewer.camera.getPickRay(screenPos);
      if (!ray) return null;
      const globePos = viewer.scene.globe.pick(ray, viewer.scene);
      if (!globePos) return null;
      const carto = Cartographic.fromCartesian(globePos);
      return {
        longitude: CesiumMath.toDegrees(carto.longitude),
        latitude: CesiumMath.toDegrees(carto.latitude),
        height: carto.height,
      };
    },
    [viewer],
  );

  const cleanup = useCallback(() => {
    if (handlerRef.current) {
      handlerRef.current.destroy();
      handlerRef.current = null;
    }
    if (previewEntityRef.current && viewer) {
      viewer.entities.remove(previewEntityRef.current);
      previewEntityRef.current = null;
    }
    drawingCornersRef.current = [];
    mousePosRef.current = null;
    roomHeightRef.current = 3;
    baseHeightRef.current = 0;
    completedRef.current = false;
    centerLonRef.current = 0;
    centerLatRef.current = 0;
    offsetsRef.current = [];
    scaleXRef.current = 1;
    scaleYRef.current = 1;
    initialWidthRef.current = 0;
    initialDepthRef.current = 0;
    setCornersCount(0);
  }, [viewer]);

  const computeBboxFromCorners = useCallback(
    (corners: { longitude: number; latitude: number }[]) => {
      const lons = corners.map((c) => c.longitude);
      const lats = corners.map((c) => c.latitude);
      const west = Math.min(...lons);
      const east = Math.max(...lons);
      const south = Math.min(...lats);
      const north = Math.max(...lats);
      const cLat = (south + north) / 2;
      return {
        west,
        east,
        south,
        north,
        widthMeters: (east - west) * degToMetersLon(cLat),
        depthMeters: (north - south) * DEG_TO_METERS_LAT,
      };
    },
    [],
  );

  const recomputeBboxResult = useCallback(() => {
    const currentCorners = offsetsRef.current.map((o) => ({
      longitude: centerLonRef.current + o.dlon * scaleXRef.current,
      latitude: centerLatRef.current + o.dlat * scaleYRef.current,
    }));

    const { west, east, south, north, widthMeters, depthMeters } =
      computeBboxFromCorners(currentCorners);

    setBboxResult((prev) =>
      prev
        ? {
            ...prev,
            corners: currentCorners,
            west,
            east,
            south,
            north,
            widthMeters,
            depthMeters,
            center: {
              longitude: centerLonRef.current,
              latitude: centerLatRef.current,
              height: prev.height,
            },
          }
        : null,
    );
  }, [computeBboxFromCorners]);

  const startDrawing = useCallback(() => {
    if (!viewer) return;

    cleanup();
    setDrawingPhase("drawing");
    setBboxResult(null);

    const handler = new ScreenSpaceEventHandler(viewer.canvas);
    handlerRef.current = handler;

    handler.setInputAction(
      (movement: { endPosition: Cartesian2 }) => {
        if (
          drawingCornersRef.current.length > 0 &&
          !completedRef.current
        ) {
          const pos = pickCartographic(movement.endPosition);
          if (pos) {
            mousePosRef.current = {
              longitude: pos.longitude,
              latitude: pos.latitude,
            };
          }
        }
      },
      ScreenSpaceEventType.MOUSE_MOVE,
    );

    handler.setInputAction(
      (click: { position: Cartesian2 }) => {
        if (completedRef.current) return;

        const pos = pickCartographic(click.position);
        if (!pos) return;

        drawingCornersRef.current.push(pos);
        const count = drawingCornersRef.current.length;
        setCornersCount(count);

        if (count === 1) {
          baseHeightRef.current = pos.height;
        }

        // After 2 corners, create the polygon preview (needs 2 corners + mouse = 3 pts)
        if (count === 2) {
          const entity = viewer.entities.add({
            polygon: {
              hierarchy: new CallbackProperty(() => {
                let positions: Cartesian3[];

                if (completedRef.current) {
                  positions = offsetsRef.current.map((o) =>
                    Cartesian3.fromDegrees(
                      centerLonRef.current + o.dlon * scaleXRef.current,
                      centerLatRef.current + o.dlat * scaleYRef.current,
                    ),
                  );
                } else {
                  positions = drawingCornersRef.current.map((c) =>
                    Cartesian3.fromDegrees(c.longitude, c.latitude),
                  );
                  const mouse = mousePosRef.current;
                  if (mouse && drawingCornersRef.current.length < 4) {
                    positions.push(
                      Cartesian3.fromDegrees(
                        mouse.longitude,
                        mouse.latitude,
                      ),
                    );
                  }
                }

                if (positions.length < 3) return new PolygonHierarchy([]);
                return new PolygonHierarchy(positions);
              }, false),
              material: Color.DODGERBLUE.withAlpha(0.3),
              height: new CallbackProperty(
                () => baseHeightRef.current,
                false,
              ),
              extrudedHeight: new CallbackProperty(
                () => baseHeightRef.current + roomHeightRef.current,
                false,
              ),
              outline: true,
              outlineColor: Color.DODGERBLUE,
            },
          });
          previewEntityRef.current = entity;
        }

        // 4 corners → complete
        if (count === 4) {
          completedRef.current = true;

          const corners = drawingCornersRef.current;
          const avgLon =
            corners.reduce((s, c) => s + c.longitude, 0) / corners.length;
          const avgLat =
            corners.reduce((s, c) => s + c.latitude, 0) / corners.length;
          const minHeight = Math.min(...corners.map((c) => c.height));

          centerLonRef.current = avgLon;
          centerLatRef.current = avgLat;
          baseHeightRef.current = minHeight;

          offsetsRef.current = corners.map((c) => ({
            dlon: c.longitude - avgLon,
            dlat: c.latitude - avgLat,
          }));

          scaleXRef.current = 1;
          scaleYRef.current = 1;

          const cornerCoords = corners.map((c) => ({
            longitude: c.longitude,
            latitude: c.latitude,
          }));
          const { west, east, south, north, widthMeters, depthMeters } =
            computeBboxFromCorners(cornerCoords);

          initialWidthRef.current = widthMeters;
          initialDepthRef.current = depthMeters;

          setBboxResult({
            corners: cornerCoords,
            west,
            south,
            east,
            north,
            height: minHeight,
            roomHeight: roomHeightRef.current,
            widthMeters,
            depthMeters,
            center: {
              longitude: avgLon,
              latitude: avgLat,
              height: minHeight,
            },
          });
          setDrawingPhase("complete");

          if (handlerRef.current) {
            handlerRef.current.destroy();
            handlerRef.current = null;
          }
        }
      },
      ScreenSpaceEventType.LEFT_CLICK,
    );
  }, [viewer, cleanup, pickCartographic, computeBboxFromCorners]);

  const cancelDrawing = useCallback(() => {
    cleanup();
    setDrawingPhase("idle");
    setBboxResult(null);
  }, [cleanup]);

  const updateRoomHeight = useCallback((newHeight: number) => {
    roomHeightRef.current = newHeight;
    setBboxResult((prev) =>
      prev ? { ...prev, roomHeight: newHeight } : null,
    );
  }, []);

  const updateBboxWidth = useCallback(
    (meters: number) => {
      if (initialWidthRef.current === 0) return;
      scaleXRef.current = meters / initialWidthRef.current;
      recomputeBboxResult();
    },
    [recomputeBboxResult],
  );

  const updateBboxDepth = useCallback(
    (meters: number) => {
      if (initialDepthRef.current === 0) return;
      scaleYRef.current = meters / initialDepthRef.current;
      recomputeBboxResult();
    },
    [recomputeBboxResult],
  );

  const shiftLon = useCallback(
    (meters: number) => {
      centerLonRef.current += meters / degToMetersLon(centerLatRef.current);
      recomputeBboxResult();
    },
    [recomputeBboxResult],
  );

  const shiftLat = useCallback(
    (meters: number) => {
      centerLatRef.current += meters / DEG_TO_METERS_LAT;
      recomputeBboxResult();
    },
    [recomputeBboxResult],
  );

  const shiftAltitude = useCallback((meters: number) => {
    baseHeightRef.current += meters;
    setBboxResult((prev) =>
      prev
        ? {
            ...prev,
            height: prev.height + meters,
            center: {
              ...prev.center,
              height: prev.center.height + meters,
            },
          }
        : null,
    );
  }, []);

  const removePreviewEntity = useCallback(() => {
    if (previewEntityRef.current && viewer) {
      viewer.entities.remove(previewEntityRef.current);
      previewEntityRef.current = null;
    }
  }, [viewer]);

  const redraw = useCallback(() => {
    cleanup();
    setDrawingPhase("idle");
    setBboxResult(null);
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    drawingPhase,
    bboxResult,
    cornersCount,
    startDrawing,
    cancelDrawing,
    updateRoomHeight,
    updateBboxWidth,
    updateBboxDepth,
    shiftLon,
    shiftLat,
    shiftAltitude,
    redraw,
    removePreviewEntity,
  };
}
