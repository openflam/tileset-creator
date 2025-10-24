import {
    Viewer, Entity, Cartesian3, Color, VerticalOrigin, HorizontalOrigin,
    CallbackProperty, ConstantPositionProperty, HeadingPitchRoll, Transforms
} from 'cesium';

export interface LabelOptions {
    position: Cartesian3;
    text: string;
    viewer: Viewer;
}

export class Label {
    private viewer: Viewer;
    private pinEntity!: Entity;
    private xAxisEntity!: Entity;
    private yAxisEntity!: Entity;
    private zAxisEntity!: Entity;
    private labelEntity!: Entity;
    private startPosition: Cartesian3;

    constructor(options: LabelOptions) {
        this.viewer = options.viewer;
        this.startPosition = options.position.clone();
        
        this.createPinEntities(options);
        // Dragging disabled - setupEventHandlers() not called
        // this.setupEventHandlers();
    }

    private createPinEntities(options: LabelOptions) {
        const position = options.position;
        const shortAxisLength = 10; // Very short axis lines in meters

        // Main pin - 3D GLB model
        const heading = 0;
        const pitch = 0;
        const roll = 0;
        const hpr = new HeadingPitchRoll(heading, pitch, roll);
        const orientation = Transforms.headingPitchRollQuaternion(position, hpr);

        this.pinEntity = this.viewer.entities.add({
            position: position,
            orientation: orientation,
            model: {
                uri: '/src/assets/label.glb',
                minimumPixelSize: 64,
                maximumScale: 20000,
                scale: 1.0,
                heightReference: undefined
            }
        });

        // Label
        this.labelEntity = this.viewer.entities.add({
            position: position,
            label: {
                text: options.text,
                font: '12pt sans-serif',
                fillColor: Color.YELLOW,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                verticalOrigin: VerticalOrigin.BOTTOM,
                horizontalOrigin: HorizontalOrigin.CENTER,
                pixelOffset: new Cartesian3(0, -40, 0),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        });

        // X-axis direction indicator (Red - East)
        this.xAxisEntity = this.viewer.entities.add({
            polyline: {
                positions: new CallbackProperty(() => {
                    const pos = this.pinEntity.position?.getValue(this.viewer.clock.currentTime);
                    if (!pos) return [];
                    
                    const east = Cartesian3.add(pos, new Cartesian3(shortAxisLength, 0, 0), new Cartesian3());
                    return [pos, east];
                }, false),
                width: 2,
                material: Color.RED,
                clampToGround: false
            }
        });

        // Y-axis direction indicator (Green - North)
        this.yAxisEntity = this.viewer.entities.add({
            polyline: {
                positions: new CallbackProperty(() => {
                    const pos = this.pinEntity.position?.getValue(this.viewer.clock.currentTime);
                    if (!pos) return [];
                    
                    const north = Cartesian3.add(pos, new Cartesian3(0, shortAxisLength, 0), new Cartesian3());
                    return [pos, north];
                }, false),
                width: 2,
                material: Color.GREEN,
                clampToGround: false
            }
        });

        // Z-axis direction indicator (Blue - Up)
        this.zAxisEntity = this.viewer.entities.add({
            polyline: {
                positions: new CallbackProperty(() => {
                    const pos = this.pinEntity.position?.getValue(this.viewer.clock.currentTime);
                    if (!pos) return [];
                    
                    const up = Cartesian3.add(pos, new Cartesian3(0, 0, shortAxisLength), new Cartesian3());
                    return [pos, up];
                }, false),
                width: 2,
                material: Color.BLUE,
                clampToGround: false
            }
        });

        // Add custom data to identify these entities
        [this.pinEntity, this.xAxisEntity, this.yAxisEntity, this.zAxisEntity, this.labelEntity].forEach(entity => {
            (entity as any).label = this;
        });
    }

    // Position can only be changed via the input fields in the label card

    private updatePosition(newPosition: Cartesian3) {
        this.pinEntity.position = new ConstantPositionProperty(newPosition);
        this.labelEntity.position = new ConstantPositionProperty(newPosition);
        
        // Update orientation for the new position
        const heading = 0;
        const pitch = 0;
        const roll = 0;
        const hpr = new HeadingPitchRoll(heading, pitch, roll);
        const orientation = Transforms.headingPitchRollQuaternion(newPosition, hpr);
        (this.pinEntity as any).orientation = orientation;
        
        // The axis lines will update automatically due to CallbackProperty
    }

    public getPosition(): Cartesian3 {
        return this.pinEntity.position?.getValue(this.viewer.clock.currentTime) || this.startPosition;
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
        this.viewer.entities.remove(this.xAxisEntity);
        this.viewer.entities.remove(this.yAxisEntity);
        this.viewer.entities.remove(this.zAxisEntity);
        this.viewer.entities.remove(this.labelEntity);
        // handler.destroy() not needed since event handlers are not set up
    }
}

export function createLabel(options: LabelOptions): Label {
    return new Label(options);
}
