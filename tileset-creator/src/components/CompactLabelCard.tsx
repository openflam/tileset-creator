import React, { useState } from 'react';
import { Card, Collapse } from 'react-bootstrap';
import { ChevronDown, ChevronRight } from 'react-bootstrap-icons';
import { type LabelInfo } from './LabelCard';

interface CompactLabelCardProps {
    label: LabelInfo;
}

const CompactLabelCard: React.FC<CompactLabelCardProps> = ({ label }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="mb-2" style={{ fontSize: '0.9rem' }}>
            <Card.Body className="p-2">
                <div 
                    className="d-flex align-items-center justify-content-between"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="d-flex align-items-center">
                        <span className="me-2">🏷️</span>
                        <span className="text-truncate" style={{ maxWidth: '200px' }}>
                            {label.name}
                        </span>
                    </div>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
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

