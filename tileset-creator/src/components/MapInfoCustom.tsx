import { Card, Row, Col, Image, Form } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import * as Cesium from 'cesium';

interface PropsType {
    mapInfo: MapInfoWithTile;
}

function MapInfoCustom({ mapInfo }: PropsType) {
    const model = mapInfo.tile as Cesium.Model;

    // Initialize state with the model's transform
    const [params, setParams] = useState(() => {
        const matrix = model.modelMatrix.clone();
        const pos = Cesium.Matrix4.getTranslation(matrix, new Cesium.Cartesian3());
        const cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pos);

        return {
            latitude: Cesium.Math.toDegrees(cartographic.latitude),
            longitude: Cesium.Math.toDegrees(cartographic.longitude),
            altitude: cartographic.height,
            heading: 0,
            pitch: 0,
            roll: 0,
            scale: 1,
        };
    });

    // Update modelMatrix whenever params change
    useEffect(() => {
        const position = Cesium.Cartesian3.fromDegrees(
            params.longitude,
            params.latitude,
            params.altitude
        );
        const hpr = new Cesium.HeadingPitchRoll(
            Cesium.Math.toRadians(params.heading),
            Cesium.Math.toRadians(params.pitch),
            Cesium.Math.toRadians(params.roll)
        );
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
        const scale = new Cesium.Cartesian3(params.scale, params.scale, params.scale);
        model.modelMatrix = Cesium.Matrix4.fromTranslationQuaternionRotationScale(position, orientation, scale);
    }, [params, model]);

    const handleChange = (e: React.ChangeEvent<HTMLElement>, key: keyof typeof params) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        if (!isNaN(value)) {
            setParams(prev => ({ ...prev, [key]: value }));
        }
    };

    const renderControl = (label: string, key: keyof typeof params) => {
        let step = 0.1; // default step

        if (key === 'latitude' || key === 'longitude') step = 0.00001;
        else if (key === 'altitude') step = 1;
        else if (key === 'heading' || key === 'pitch' || key === 'roll') step = 1;
        else if (key === 'scale') step = 0.1;

        return (
            <Form.Group className="mb-2" controlId={`form-${key}`}>
                <Form.Label>{label}</Form.Label>
                <Form.Control
                    type="number"
                    value={params[key]}
                    // onMouseDown={e => handleMouseDown(e, key)}
                    onChange={e => handleChange(e, key)}
                    step={step}
                />
            </Form.Group>
        );
    };


    return (
        <Card className="w-100 mb-3">
            <Card.Body>
                <Row className="align-items-center mb-3">
                    <Col xs="auto">
                        <Image
                            src={mapInfo.mapIconUrl}
                            alt={mapInfo.name}
                            rounded
                            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                        />
                    </Col>
                    <Col>
                        <Card.Title className="mb-0">{mapInfo.name}</Card.Title>
                    </Col>
                </Row>

                <Form>
                    <h5 className="mt-3">Location</h5>
                    <Row>
                        <Col md={12}>{renderControl('Latitude (°)', 'latitude')}</Col>
                    </Row>
                    <Row>
                        <Col md={12}>{renderControl('Longitude (°)', 'longitude')}</Col>
                    </Row>
                    <Row>
                        <Col md={12}>{renderControl('Altitude (m)', 'altitude')}</Col>
                    </Row>

                    <h5 className="mt-4">Rotation</h5>
                    <Row>
                        <Col md={12}>{renderControl('Heading (°)', 'heading')}</Col>
                    </Row>
                    <Row>
                        <Col md={12}>{renderControl('Pitch (°)', 'pitch')}</Col>
                    </Row>
                    <Row>
                        <Col md={12}>{renderControl('Roll (°)', 'roll')}</Col>
                    </Row>

                    <h5 className="mt-4">Scale</h5>
                    <Row>
                        <Col md={12}>{renderControl('Scale', 'scale')}</Col>
                    </Row>
                </Form>

            </Card.Body>
        </Card>
    );
}

export default MapInfoCustom;
