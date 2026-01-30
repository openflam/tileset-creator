import {
  Cartesian3,
  Cartographic,
  Transforms,
  Matrix4,
  HeadingPitchRoll,
  Math as CesiumMath,
  DeveloperError,
  Ellipsoid,
} from "cesium";

/**
 * Computes the transform for a tile to place it at the given cartographic
 * position.
 *
 * The given position is either (longitudeDegrees, latitudeDegrees)
 * or (longitudeDegrees, latitudeDegrees, heightMeters). The returned
 * array will be that of a 4x4 matrix in column-major order.
 *
 * @param cartographicPositionDegrees - The cartographic position
 * @returns The transform
 * @throws DeveloperError If the given array has a length smaller than 2
 */
export function computeTransformFromCartographicPositionDegrees(
  cartographicPositionDegrees: number[],
) {
  if (cartographicPositionDegrees.length < 2) {
    throw new DeveloperError(
      `Expected an array of at least length 2, but received an array ` +
        `of length ${cartographicPositionDegrees.length}: ${cartographicPositionDegrees}`,
    );
  }
  const lonDegrees = cartographicPositionDegrees[0];
  const latDegrees = cartographicPositionDegrees[1];
  const height =
    cartographicPositionDegrees.length >= 3
      ? cartographicPositionDegrees[2]
      : 0.0;
  const cartographic = Cartographic.fromDegrees(lonDegrees, latDegrees, height);
  const cartesian = Cartographic.toCartesian(cartographic);
  const enuMatrix = Transforms.eastNorthUpToFixedFrame(cartesian);
  const transform = Matrix4.toArray(enuMatrix);
  return transform;
}

/**
 * Computes the transform for a tile to place it at the given cartographic
 * position and rotation.
 *
 * The given position is either (longitudeDegrees, latitudeDegrees)
 * or (longitudeDegrees, latitudeDegrees, heightMeters). The rotation is
 * (headingDegrees, pitchDegrees, rollDegrees).
 *
 * @param cartographicPositionDegrees - The cartographic position
 * @param rotationDegrees - The rotation in degrees
 * @param scaleValue - The scale factor (optional, defaults to 1.0)
 * @returns The transform
 * @throws DeveloperError If the given array has a length smaller than 2
 */
export function computeTransformFromCartographicPositionAndRotationDegrees(
  cartographicPositionDegrees: number[],
  rotationDegrees: number[],
  scaleValue: number = 1.0,
) {
  if (cartographicPositionDegrees.length < 2) {
    throw new DeveloperError(
      `Expected an array of at least length 2, but received an array ` +
        `of length ${cartographicPositionDegrees.length}: ${cartographicPositionDegrees}`,
    );
  }
  const lonDegrees = cartographicPositionDegrees[0];
  const latDegrees = cartographicPositionDegrees[1];
  const height =
    cartographicPositionDegrees.length >= 3
      ? cartographicPositionDegrees[2]
      : 0.0;
  const headingDegrees = rotationDegrees[0];
  const pitchDegrees = rotationDegrees[1];
  const rollDegrees = rotationDegrees[2];

  const position = Cartesian3.fromDegrees(lonDegrees, latDegrees, height);
  const hpr = new HeadingPitchRoll(
    CesiumMath.toRadians(headingDegrees),
    CesiumMath.toRadians(pitchDegrees),
    CesiumMath.toRadians(rollDegrees),
  );
  const orientation = Transforms.headingPitchRollQuaternion(position, hpr);
  const scale = new Cartesian3(scaleValue, scaleValue, scaleValue);
  const transform = Matrix4.fromTranslationQuaternionRotationScale(
    position,
    orientation,
    scale,
  );
  const transformArray = Matrix4.toArray(transform);
  return transformArray;
}

/**
 * Computes the cartographic position, rotation (heading, pitch, roll), and scale
 * from a given transformation matrix.
 *
 * @param transformArray - The 4x4 transformation matrix as an array
 * @returns Object containing latitude, longitude, altitude, heading, pitch, roll, and scale
 */
export function computeParametersFromTransform(transformArray: number[]) {
  const transform = Matrix4.fromArray(transformArray);

  // 1. Get Translation (Position)
  const position = Matrix4.getTranslation(transform, new Cartesian3());
  const cartographic = Cartographic.fromCartesian(position);

  // 2. Get Scale
  const scaleVector = Matrix4.getScale(transform, new Cartesian3());
  const scale = scaleVector.x; // Assume uniform scale for now

  // 3. Get Rotation (Heading, Pitch, Roll)
  // We need to unscale the matrix for accurate rotation extraction if scale != 1
  const unscaledTransform = Matrix4.clone(transform);
  const inverseScale = new Cartesian3(
    scale !== 0 ? 1.0 / scaleVector.x : 1.0,
    scale !== 0 ? 1.0 / scaleVector.y : 1.0,
    scale !== 0 ? 1.0 / scaleVector.z : 1.0,
  );
  Matrix4.multiplyByScale(unscaledTransform, inverseScale, unscaledTransform);

  const hpr = Transforms.fixedFrameToHeadingPitchRoll(
    unscaledTransform,
    Ellipsoid.WGS84,
    Transforms.eastNorthUpToFixedFrame,
  );

  return {
    longitude: CesiumMath.toDegrees(cartographic.longitude),
    latitude: CesiumMath.toDegrees(cartographic.latitude),
    altitude: cartographic.height,
    heading: CesiumMath.toDegrees(hpr.heading),
    pitch: CesiumMath.toDegrees(hpr.pitch),
    roll: CesiumMath.toDegrees(hpr.roll),
    scale: scale,
  };
}
