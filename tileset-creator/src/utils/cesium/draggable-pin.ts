import {
    Viewer, Entity, Cartesian3, Color, VerticalOrigin, HorizontalOrigin,
    ScreenSpaceEventHandler, ScreenSpaceEventType, defined, 
    CallbackProperty, Cartographic, Plane, IntersectionTests, ConstantPositionProperty
} from 'cesium';

export interface DraggablePinOptions {
    position: Cartesian3;
    text: string;
    viewer: Viewer;
}

export class DraggablePin {
    private viewer: Viewer;
    private pinEntity!: Entity;
    private xAxisEntity!: Entity;
    private yAxisEntity!: Entity;
    private zAxisEntity!: Entity;
    private labelEntity!: Entity;
    private handler!: ScreenSpaceEventHandler;
    private isDragging = false;
    private activeAxis: 'x' | 'y' | 'z' | 'pin' | null = null;
    private startPosition: Cartesian3;

    constructor(options: DraggablePinOptions) {
        this.viewer = options.viewer;
        this.startPosition = options.position.clone();
        
        this.createPinEntities(options);
        this.setupEventHandlers();
    }

    private createPinEntities(options: DraggablePinOptions) {
        const position = options.position;
        const shortAxisLength = 10; // Very short axis lines in meters

        // Main pin (center point)
        this.pinEntity = this.viewer.entities.add({
            position: position,
            point: {
                pixelSize: 8,
                color: Color.YELLOW,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
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
            (entity as any).draggablePin = this;
        });
    }

    private setupEventHandlers() {
        this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

        // Mouse down - start dragging
        this.handler.setInputAction((event: any) => {
            const pickedObject = this.viewer.scene.pick(event.position);
            if (defined(pickedObject) && defined(pickedObject.id)) {
                const entity = pickedObject.id;
                if ((entity as any).draggablePin === this) {
                    this.isDragging = true;
                    this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                    
                    // Determine which component was clicked
                    if (entity === this.xAxisEntity) {
                        this.activeAxis = 'x';
                    } else if (entity === this.yAxisEntity) {
                        this.activeAxis = 'y';
                    } else if (entity === this.zAxisEntity) {
                        this.activeAxis = 'z';
                    } else {
                        this.activeAxis = 'pin';
                    }
                }
            }
        }, ScreenSpaceEventType.LEFT_DOWN);

        // Mouse move - drag
        this.handler.setInputAction((event: any) => {
            if (this.isDragging && this.activeAxis) {
                const ray = this.viewer.camera.getPickRay(event.endPosition);
                if (!ray) return;

                const currentPos = this.pinEntity.position?.getValue(this.viewer.clock.currentTime);
                if (!currentPos) return;

                let newPosition: Cartesian3;

                if (this.activeAxis === 'pin') {
                    // Free movement - project to a plane parallel to ground
                    const plane = new Plane(Cartesian3.UNIT_Z, -currentPos.z);
                    const intersection = IntersectionTests.rayPlane(ray, plane);
                    newPosition = intersection || currentPos;
                } else {
                    // Constrained axis movement
                    const cartographic = Cartographic.fromCartesian(currentPos);
                    const mousePos = this.viewer.camera.pickEllipsoid(event.endPosition);
                    
                    if (mousePos) {
                        const mouseCartographic = Cartographic.fromCartesian(mousePos);
                        
                        switch (this.activeAxis) {
                            case 'x':
                                cartographic.longitude = mouseCartographic.longitude;
                                break;
                            case 'y':
                                cartographic.latitude = mouseCartographic.latitude;
                                break;
                            case 'z':
                                cartographic.height += (mouseCartographic.height - cartographic.height);
                                break;
                        }
                        
                        newPosition = Cartographic.toCartesian(cartographic);
                    } else {
                        newPosition = currentPos;
                    }
                }

                // Update all entity positions
                this.updatePosition(newPosition);
            }
        }, ScreenSpaceEventType.MOUSE_MOVE);

        // Mouse up - stop dragging
        this.handler.setInputAction(() => {
            if (this.isDragging) {
                this.isDragging = false;
                this.activeAxis = null;
                this.viewer.scene.screenSpaceCameraController.enableRotate = true;
            }
        }, ScreenSpaceEventType.LEFT_UP);
    }

    private updatePosition(newPosition: Cartesian3) {
        this.pinEntity.position = new ConstantPositionProperty(newPosition);
        this.labelEntity.position = new ConstantPositionProperty(newPosition);
        
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
        this.handler.destroy();
    }
}

export function createDraggablePin(options: DraggablePinOptions): DraggablePin {
    return new DraggablePin(options);
}
