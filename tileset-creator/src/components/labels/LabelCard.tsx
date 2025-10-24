import React, { useState } from 'react';
import { Card, Form, InputGroup, Button, Row, Col } from 'react-bootstrap';
import { Trash } from 'react-bootstrap-icons';
import { DraggablePin } from '../../utils/cesium/draggable-pin';
import { Math as CesiumMath, Cartographic } from 'cesium';

export interface LabelInfo {
    id: string;
    name: string;
    position: {
        longitude: number;
        latitude: number;
        height: number;
    };
    pin: DraggablePin;
    mapUrl?: string; // The map URL this label belongs to
}

interface LabelCardProps {
    label: LabelInfo;
    onPositionChange: (id: string, position: { longitude: number; latitude: number; height: number }) => void;
    onDelete: (id: string) => void;
}

const LabelCard: React.FC<LabelCardProps> = ({ label, onPositionChange, onDelete }) => {
    const [position, setPosition] = useState(label.position);
    const [isEditing, setIsEditing] = useState(false);

    const handlePositionUpdate = (field: 'longitude' | 'latitude' | 'height', value: number) => {
        const newPosition = { ...position, [field]: value };
        setPosition(newPosition);
        onPositionChange(label.id, newPosition);
    };

    const getCurrentPosition = () => {
        try {
            const currentPos = label.pin.getPosition();
            const cartographic = Cartographic.fromCartesian(currentPos);
            const newPosition = {
                longitude: parseFloat(CesiumMath.toDegrees(cartographic.longitude).toFixed(6)),
                latitude: parseFloat(CesiumMath.toDegrees(cartographic.latitude).toFixed(6)),
                height: Math.round(cartographic.height)
            };
            setPosition(newPosition);
            onPositionChange(label.id, newPosition);
            
            // Show browser notification
            showSyncNotification();
        } catch (error) {
            console.error('Failed to get current position:', error);
            // Show error notification
            showErrorNotification();
        }
    };

    const showSyncNotification = () => {
        // Show browser popup window
        alert(`Label Synced!\n\n"${label.name}" has been synced with the database.`);
        
        // Also log for debugging
        console.log(`✅ Label "${label.name}" synced with database`);
    };

    const showErrorNotification = () => {
        // Show browser popup window for error
        alert(`❌ Sync Failed!\n\nFailed to sync "${label.name}" with the database.`);
        
        console.error(`❌ Failed to sync label "${label.name}"`);
    };

    return (
        <Card className="w-100 mb-3">
            <Card.Body>
                <Row className="align-items-center mb-2">
                    <Col>
                        <Card.Title className="mb-0 text-truncate" title={label.name}>
                            📍 {label.name}
                        </Card.Title>
                    </Col>
                    <Col xs="auto">
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => onDelete(label.id)}
                            title="Delete Label"
                        >
                            <Trash size={14} />
                        </Button>
                    </Col>
                </Row>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Position</small>
                    <div>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                            className="me-2"
                        >
                            {isEditing ? 'Done' : 'Edit'}
                        </Button>
                        <Button
                            variant="outline-info"
                            size="sm"
                            onClick={getCurrentPosition}
                            title="Get current position from 3D pin"
                        >
                            Sync
                        </Button>
                    </div>
                </div>

                {isEditing ? (
                    <>
                        <InputGroup className="mb-2" size="sm">
                            <InputGroup.Text>Lon</InputGroup.Text>
                            <Form.Control
                                type="number"
                                step="0.000001"
                                value={position.longitude}
                                onChange={(e) => handlePositionUpdate('longitude', parseFloat(e.target.value) || 0)}
                            />
                        </InputGroup>

                        <InputGroup className="mb-2" size="sm">
                            <InputGroup.Text>Lat</InputGroup.Text>
                            <Form.Control
                                type="number"
                                step="0.000001"
                                value={position.latitude}
                                onChange={(e) => handlePositionUpdate('latitude', parseFloat(e.target.value) || 0)}
                            />
                        </InputGroup>

                        <InputGroup size="sm">
                            <InputGroup.Text>Alt</InputGroup.Text>
                            <Form.Control
                                type="number"
                                step="1"
                                value={position.height}
                                onChange={(e) => handlePositionUpdate('height', parseFloat(e.target.value) || 0)}
                            />
                            <InputGroup.Text>m</InputGroup.Text>
                        </InputGroup>
                    </>
                ) : (
                    <div className="text-muted small">
                        <div>Lon: {position.longitude.toFixed(6)}°</div>
                        <div>Lat: {position.latitude.toFixed(6)}°</div>
                        <div>Alt: {position.height}m</div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default LabelCard;
