import React, { useState } from 'react';
import { Card, Collapse, Button, InputGroup, Form } from 'react-bootstrap';
import { ChevronDown, ChevronRight, X, ChevronUp } from 'react-bootstrap-icons';
import { type LabelInfo } from './LabelCard';
import { Viewer, Cartesian3, Math as CesiumMath } from 'cesium';

interface CompactLabelCardProps {
    label: LabelInfo;
    onDelete?: (id: string) => void;
    onPositionChange?: (id: string, position: { longitude: number; latitude: number; height: number }) => void;
    viewer?: Viewer | null;
}

const CompactLabelCard: React.FC<CompactLabelCardProps> = ({ label, onDelete, onPositionChange, viewer }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [position, setPosition] = useState(label.position);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent expanding/collapsing when clicking delete
        if (onDelete) {
            onDelete(label.id);
        }
    };

    const handlePositionUpdate = (field: 'longitude' | 'latitude' | 'height', value: number) => {
        const newPosition = { ...position, [field]: value };
        setPosition(newPosition);
        if (onPositionChange) {
            onPositionChange(label.id, newPosition);
        }
    };

    const handleIncrement = (field: 'longitude' | 'latitude' | 'height') => {
        const increment = field === 'height' ? 1 : 0.001;
        handlePositionUpdate(field, position[field] + increment);
    };

    const handleDecrement = (field: 'longitude' | 'latitude' | 'height') => {
        const decrement = field === 'height' ? 1 : 0.001;
        handlePositionUpdate(field, position[field] - decrement);
    };

    const handleFlyTo = () => {
        if (!viewer) {
            alert('Viewer not available');
            return;
        }

        try {
            // Create destination position
            const destination = Cartesian3.fromDegrees(
                label.position.longitude,
                label.position.latitude,
                label.position.height
            );

            // Use stored orientation if available, otherwise use default
            const orientation = label.orientation ? {
                heading: CesiumMath.toRadians(label.orientation.heading),
                pitch: CesiumMath.toRadians(label.orientation.pitch),
                roll: CesiumMath.toRadians(label.orientation.roll)
            } : {
                heading: CesiumMath.toRadians(0),
                pitch: CesiumMath.toRadians(-45),
                roll: CesiumMath.toRadians(0)
            };

            console.log(`🚀 Flying to label: ${label.name}`, {
                position: {
                    longitude: label.position.longitude,
                    latitude: label.position.latitude,
                    height: label.position.height
                },
                orientation: label.orientation || 'default (-45° pitch)',
                destination: destination
            });

            // Fly to the label position with recorded orientation
            viewer.camera.flyTo({
                destination: destination,
                orientation: orientation,
                duration: 2.0,
                complete: () => {
                    console.log(`✅ Arrived at label: ${label.name}`);
                }
            });
        } catch (error) {
            console.error('❌ Error flying to label:', error);
            alert(`Error flying to ${label.name}: ${error}`);
        }
    };

    return (
        <Card className="mb-2" style={{ fontSize: '0.9rem' }}>
            <Card.Body className="p-2">
                <div 
                    className="d-flex align-items-center justify-content-between"
                >
                    <div 
                        className="d-flex align-items-center flex-grow-1"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <span className="me-2">🏷️</span>
                        <span className="text-truncate" style={{ maxWidth: '150px' }}>
                            {label.name}
                        </span>
                        <span className="ms-2">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                    </div>
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-danger"
                        onClick={handleDelete}
                        title="Delete label"
                        style={{ minWidth: 'auto' }}
                    >
                        <X size={18} />
                    </Button>
                </div>
                
                <Collapse in={isExpanded}>
                    <div className="mt-2 pt-2 border-top">
                        {/* Longitude */}
                        <InputGroup size="sm" className="mb-2">
                            <InputGroup.Text style={{ minWidth: '50px' }}>Lon</InputGroup.Text>
                            <Form.Control
                                type="number"
                                step="0.001"
                                value={position.longitude}
                                onChange={(e) => handlePositionUpdate('longitude', parseFloat(e.target.value) || 0)}
                                style={{ fontSize: '0.85rem' }}
                            />
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleIncrement('longitude')}
                                style={{ padding: '0.25rem 0.5rem' }}
                            >
                                <ChevronUp size={12} />
                            </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleDecrement('longitude')}
                                style={{ padding: '0.25rem 0.5rem' }}
                            >
                                <ChevronDown size={12} />
                            </Button>
                        </InputGroup>

                        {/* Latitude */}
                        <InputGroup size="sm" className="mb-2">
                            <InputGroup.Text style={{ minWidth: '50px' }}>Lat</InputGroup.Text>
                            <Form.Control
                                type="number"
                                step="0.001"
                                value={position.latitude}
                                onChange={(e) => handlePositionUpdate('latitude', parseFloat(e.target.value) || 0)}
                                style={{ fontSize: '0.85rem' }}
                            />
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleIncrement('latitude')}
                                style={{ padding: '0.25rem 0.5rem' }}
                            >
                                <ChevronUp size={12} />
                            </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleDecrement('latitude')}
                                style={{ padding: '0.25rem 0.5rem' }}
                            >
                                <ChevronDown size={12} />
                            </Button>
                        </InputGroup>

                        {/* Height */}
                        <InputGroup size="sm" className="mb-2">
                            <InputGroup.Text style={{ minWidth: '50px' }}>Height</InputGroup.Text>
                            <Form.Control
                                type="number"
                                step="1"
                                value={position.height}
                                onChange={(e) => handlePositionUpdate('height', parseFloat(e.target.value) || 0)}
                                style={{ fontSize: '0.85rem' }}
                            />
                            <InputGroup.Text>m</InputGroup.Text>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleIncrement('height')}
                                style={{ padding: '0.25rem 0.5rem' }}
                            >
                                <ChevronUp size={12} />
                            </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleDecrement('height')}
                                style={{ padding: '0.25rem 0.5rem' }}
                            >
                                <ChevronDown size={12} />
                            </Button>
                        </InputGroup>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleFlyTo}
                            disabled={!viewer}
                            className="w-100 mt-2"
                        >
                            🚀 Fly To
                        </Button>
                    </div>
                </Collapse>
            </Card.Body>
        </Card>
    );
};

export default CompactLabelCard;

