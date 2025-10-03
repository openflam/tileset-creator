import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { Viewer } from 'cesium';
import { DraggablePin } from '../utils/cesium/draggable-pin';

interface AddLabelModalProps {
    show: boolean;
    onClose: () => void;
    viewer: Viewer | null;
    onLabelCreated: (labelInfo: { id: string; name: string; position: { longitude: number; latitude: number; height: number }; pin: DraggablePin }) => void;
    onStartPositionSelection: (labelText: string) => void;
}

const AddLabelModal: React.FC<AddLabelModalProps> = ({ show, onClose, onStartPositionSelection }) => {
    const [labelText, setLabelText] = useState('');

    const resetForm = () => {
        setLabelText('');
    };

    const handleStartPositionSelection = () => {
        if (!labelText.trim()) return;
        
        // Start position selection mode
        onStartPositionSelection(labelText);
        
        // Close modal and reset form
        resetForm();
        onClose();
    };

    return (
        <Modal show={show} onHide={onClose} centered onExited={resetForm}>
            <Modal.Header closeButton>
                <Modal.Title>Add Label</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Label Text</Form.Label>
                        <Form.Control
                            type="text"
                            value={labelText}
                            onChange={(e) => setLabelText(e.target.value)}
                            placeholder="Enter label text..."
                            autoFocus
                        />
                    </Form.Group>
                    
                    <Alert variant="info" className="mb-3">
                        <strong>Next step:</strong> After clicking "Continue", click on the map to choose where to place the label.
                    </Alert>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleStartPositionSelection} disabled={!labelText.trim()}>
                    Continue - Click on Map
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddLabelModal;