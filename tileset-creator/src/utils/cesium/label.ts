import {
  Viewer,
  Entity,
  Cartesian3,
  Color,
  VerticalOrigin,
  HorizontalOrigin,
  ConstantPositionProperty,
  HeadingPitchRoll,
  Transforms,
} from "cesium";

export interface LabelOptions {
  position: Cartesian3;
  text: string;
  viewer: Viewer;
}

export class Label {
  private viewer: Viewer;
  private pinEntity!: Entity;
  private labelEntity!: Entity;
  private startPosition: Cartesian3;

  constructor(options: LabelOptions) {
    this.viewer = options.viewer;
    this.startPosition = options.position.clone();

    this.createPinEntities(options);
  }

  private createPinEntities(options: LabelOptions) {
    const position = options.position;

    const heading = 0;
    const pitch = 0;
    const roll = 0;
    const hpr = new HeadingPitchRoll(heading, pitch, roll);
    const orientation = Transforms.headingPitchRollQuaternion(position, hpr);

    this.pinEntity = this.viewer.entities.add({
      position: position,
      orientation: orientation,
      model: {
        uri: "/src/assets/label.glb",
        minimumPixelSize: 64,
        maximumScale: 20000,
        scale: 1.0,
        heightReference: undefined,
      },
    });

    this.labelEntity = this.viewer.entities.add({
      position: position,
      label: {
        text: options.text,
        font: "12pt sans-serif",
        fillColor: Color.YELLOW,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.CENTER,
        pixelOffset: new Cartesian3(0, -40, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  private updatePosition(newPosition: Cartesian3) {
    this.pinEntity.position = new ConstantPositionProperty(newPosition);
    this.labelEntity.position = new ConstantPositionProperty(newPosition);

    const heading = 0;
    const pitch = 0;
    const roll = 0;
    const hpr = new HeadingPitchRoll(heading, pitch, roll);
    const orientation = Transforms.headingPitchRollQuaternion(newPosition, hpr);
    (this.pinEntity as any).orientation = orientation;
  }

  public getPosition(): Cartesian3 {
    return (
      this.pinEntity.position?.getValue(this.viewer.clock.currentTime) ||
      this.startPosition
    );
  }

  public setText(text: string) {
    if (this.labelEntity.label) {
      (this.labelEntity.label as any).text = text;
    }
  }

  public setPosition(longitude: number, latitude: number, height: number) {
    const newPosition = Cartesian3.fromDegrees(longitude, latitude, height);
    this.updatePosition(newPosition);
  }

  public destroy() {
    this.viewer.entities.remove(this.pinEntity);
    this.viewer.entities.remove(this.labelEntity);
  }
}

export function createLabel(options: LabelOptions): Label {
  return new Label(options);
}
