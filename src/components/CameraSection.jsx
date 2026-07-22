import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Camera, Mic, ScanLine } from 'lucide-react';
import { TONE_CONFIG } from '../utils/config';

const CameraSection = memo(({
  isRunning,
  onToggleCamera,
  onToneChange,
  services,
  modelStatus,
  error,
  currentTone
}) => {
  const [fps, setFps] = useState(30);
  const [cameraList, setCameraList] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('default');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);


  useEffect(() => {
    const cameraService = services?.camera;
    if (cameraService) {
      if (videoRef.current && !cameraService.video) {
        cameraService.setVideoElement(videoRef.current);
      }
      if (canvasRef.current && !cameraService.canvas) {
        cameraService.setCanvasElement(canvasRef.current);
      }
    }
  }, [services?.camera]);


  useEffect(() => {
    let isMounted = true;
    if (services?.camera?.loadCameras) {
      services.camera.loadCameras().then((devices) => {
        if (isMounted && devices && devices.length > 0) {
          setCameraList(devices);
        }
      }).catch(() => {

      });
    }
    return () => { isMounted = false; };
  }, [services?.camera]);


  useEffect(() => {
    if (services?.camera) {
      services.camera.setFPS(fps);
    }
  }, [fps, services?.camera]);

  const handleCameraChange = useCallback((e) => {
    const deviceId = e.target.value;
    setSelectedCameraId(deviceId);
    if (services?.camera && services.camera.isActive()) {
      services.camera.startCamera(deviceId);
    }
  }, [services?.camera]);

  const handleFpsChange = useCallback((e) => {
    setFps(Number(e.target.value));
  }, []);

  const handleToneChange = useCallback((e) => {
    const newTone = e.target.value;
    if (onToneChange) {
      onToneChange(newTone);
    }
  }, [onToneChange]);

  const isModelReady = modelStatus === 'Model AI Siap';
  const buttonDisabled = !isModelReady;
  const buttonText = isRunning ? 'Stop Scan' : 'Mulai Scan';

  return (
    <section className="camera-section" aria-label="Camera Feed and Controls">
      <div className="camera-container">
        <div className="camera-wrapper">
          <video
            ref={videoRef}
            id="media-video"
            autoPlay
            muted
            playsInline
            className={isRunning ? '' : 'hidden'}
          />
          <canvas
            ref={canvasRef}
            id="media-canvas"
            className="hidden"
          />

          <div className={`camera-overlay ${isRunning ? 'active' : ''}`}>
            <div className="overlay-frame"></div>
          </div>

          {!isRunning && (
            <div className="camera-placeholder">
              <Camera size={48} />
              <p>Kamera tidak aktif</p>
              {error && (
                <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="camera-controls">
          <button
            id="btn-toggle"
            className={`capture-btn ${isRunning ? 'scanning' : ''}`}
            onClick={onToggleCamera}
            disabled={buttonDisabled}
            aria-label={buttonText}
            style={{ opacity: buttonDisabled ? 0.6 : 1 }}
          >
            <ScanLine size={24} />
          </button>
        </div>

        <div className="settings-bar">
          <div className="setting-item">
            <Camera size={16} />
            <select
              id="camera-select"
              value={selectedCameraId}
              onChange={handleCameraChange}
              disabled={isRunning}
            >
              {cameraList.length > 0 ? (
                cameraList.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="default">Belakang</option>
                  <option value="front">Depan</option>
                </>
              )}
            </select>
          </div>

          <div className="setting-item fps-setting">
            <span id="fps-label">{fps} FPS</span>
            <input
              id="fps-slider"
              type="range"
              min="15"
              max="60"
              step="15"
              value={fps}
              onChange={handleFpsChange}
              disabled={isRunning}
            />
          </div>

          <div className="setting-item tone-setting">
            <Mic size={16} />
            <select
              id="tone-select"
              value={currentTone || 'normal'}
              onChange={handleToneChange}
              disabled={isRunning}
            >
              {TONE_CONFIG.availableTones.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
});

CameraSection.displayName = 'CameraSection';
export default CameraSection;