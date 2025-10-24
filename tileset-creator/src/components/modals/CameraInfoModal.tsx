import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { Viewer } from 'cesium';
import { getCurrentCameraView, parseCameraViewData, flyToCameraView } from '../../utils/cesium/camera-utils';

interface CameraInfoModalProps {
    show: boolean;
    onClose: () => void;
    viewer: Viewer | null;
}

const CameraInfoModal: React.FC<CameraInfoModalProps> = ({ show, onClose, viewer }) => {
    const [cameraInfo, setCameraInfo] = useState<string>('');
    const [inputCameraView, setInputCameraView] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState<boolean>(false);
    const [parseError, setParseError] = useState<string>('');
    const [isFlying, setIsFlying] = useState<boolean>(false);

    // Update camera info when modal is shown
    useEffect(() => {
        if (show && viewer) {
            const updateCameraInfo = () => {
                try {
                    const currentView = getCurrentCameraView(viewer);
                    setCameraInfo(JSON.stringify(currentView, null, 2));
                } catch (error) {
                    setCameraInfo('Error getting camera info');
                }
            };

            // Update immediately
            updateCameraInfo();

            // Update every 100ms while modal is open
            const interval = setInterval(updateCameraInfo, 100);

            return () => clearInterval(interval);
        }
    }, [show, viewer]);

    const handleCopyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(cameraInfo);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const handleFlyToView = async () => {
        if (!viewer || !inputCameraView.trim()) return;

        try {
            setParseError('');
            setIsFlying(true);

            const cameraViewData = parseCameraViewData(inputCameraView);
            await flyToCameraView(viewer, cameraViewData);
            
            setInputCameraView(''); // Clear input after successful flight
        } catch (error) {
            setParseError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setIsFlying(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Camera Information</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Current Camera View */}
                <div className="mb-4">
                    <h6>Current Camera View</h6>
                    <Form.Control
                        as="textarea"
                        rows={8}
                        value={cameraInfo}
                        readOnly
                        className="font-monospace small"
                        style={{ fontSize: '0.8rem' }}
                    />
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        className="mt-2"
                        onClick={handleCopyToClipboard}
                    >
                        Copy to Clipboard
                    </Button>
                    {copySuccess && (
                        <Alert variant="success" className="mt-2 py-1">
                            Copied to clipboard!
                        </Alert>
                    )}
                </div>

                {/* Fly to Camera View */}
                <div>
                    <h6>Fly to Camera View</h6>
                    <Form.Control
                        as="textarea"
                        rows={6}
                        value={inputCameraView}
                        onChange={(e) => setInputCameraView(e.target.value)}
                        placeholder="Paste camera view JSON here..."
                        className="font-monospace small"
                        style={{ fontSize: '0.8rem' }}
                    />
                    {parseError && (
                        <Alert variant="danger" className="mt-2 py-1">
                            {parseError}
                        </Alert>
                    )}
                    <Button
                        variant="primary"
                        size="sm"
                        className="mt-2"
                        onClick={handleFlyToView}
                        disabled={!inputCameraView.trim() || isFlying}
                    >
                        {isFlying ? 'Flying...' : 'Fly to View'}
                    </Button>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CameraInfoModal;
