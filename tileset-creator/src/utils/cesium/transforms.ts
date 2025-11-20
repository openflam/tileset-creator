import {
  Cartesian3,
  Cartographic,
  Transforms,
  Matrix4,
  HeadingPitchRoll,
  Math as CesiumMath,
  DeveloperError,
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
