import React, { useState } from 'react';
import { Card, Collapse, Button } from 'react-bootstrap';
import { ChevronDown, ChevronRight, X } from 'react-bootstrap-icons';
import { type LabelInfo } from './LabelCard';

interface CompactLabelCardProps {
    label: LabelInfo;
    onDelete?: (id: string) => void;
}

const CompactLabelCard: React.FC<CompactLabelCardProps> = ({ label, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent expanding/collapsing when clicking delete
        if (onDelete) {
            onDelete(label.id);
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
                        <div className="text-muted small">
                            <div><strong>Lon:</strong> {label.position.longitude.toFixed(6)}°</div>
                            <div><strong>Lat:</strong> {label.position.latitude.toFixed(6)}°</div>
                            <div><strong>Height:</strong> {label.position.height}m</div>
                        </div>
                    </div>
                </Collapse>
            </Card.Body>
        </Card>
    );
};

export default CompactLabelCard;

