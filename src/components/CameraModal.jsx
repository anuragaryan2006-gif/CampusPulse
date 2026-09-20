import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle, X, SwitchCamera, ShieldCheck, Sun } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onConfirmAttendance, sessionDetails }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back camera
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingText, setVerifyingText] = useState('Verifying face identity...');

  useEffect(() => {
    if (isOpen && !capturedPhoto) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedPhoto]);

  async function startCamera() {
    setPermissionError(null);
    stopCamera();

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera permission is required to take attendance. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No camera found on this device. Please use a device with a camera.');
      } else {
        setPermissionError(`Unable to open camera: ${err.message || 'Unknown error'}.`);
      }
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  function handleCapture() {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    
    // Flip horizontally if front facing camera for natural mirror effect
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
    stopCamera();
  }

  function handleDevSimulateCapture() {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#312e81');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 480);

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(320, 200, 100, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CampusPulse In-App Live Capture', 320, 340);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText(`Timestamp: ${new Date().toISOString()}`, 320, 375);
    ctx.fillText('STATUS: SIMULATED_LIVE_DEV_PHOTO', 320, 400);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
    setPermissionError(null);
    stopCamera();
  }

  function handleRetake() {
    setCapturedPhoto(null);
    startCamera();
  }

  async function handleConfirm() {
    if (!capturedPhoto || isVerifying) return;
    setIsVerifying(true);
    setVerifyingText('Verifying identity & anti-proxy parameters...');

    try {
      await onConfirmAttendance(capturedPhoto);
    } catch (err) {
      console.error('Confirmation error:', err);
    } finally {
      setIsVerifying(false);
    }
  }

  function toggleCameraFacing() {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col max-h-[92vh]">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-gray-900/90 border-b border-gray-800 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs tracking-widest font-bold uppercase text-gray-300">ATTENDANCE CAMERA</span>
          </div>
          <button
            onClick={onClose}
            disabled={isVerifying}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subject Header Info */}
        {sessionDetails && (
          <div className="bg-blue-950/60 px-5 py-2 border-b border-blue-900/50 flex justify-between items-center text-xs text-blue-200">
            <span className="font-semibold text-white">{sessionDetails.subject_name}</span>
            <span className="bg-blue-500/20 px-2 py-0.5 rounded text-[11px] border border-blue-400/30">
              {sessionDetails.schedule_time}
            </span>
          </div>
        )}

        {/* Main Camera / Preview Viewport */}
        <div className="relative flex-1 bg-black min-h-[360px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
          {permissionError ? (
            <div className="p-6 text-center text-gray-300 max-w-xs space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-white text-base">Camera Access Error</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{permissionError}</p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-colors"
                >
                  Retry Camera Access
                </button>
                <button
                  type="button"
                  onClick={handleDevSimulateCapture}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[11px] font-medium transition-colors"
                >
                  Use Dev Test Capture (Simulated Photo)
                </button>
              </div>
            </div>
          ) : capturedPhoto ? (
            // Photo Preview Screen
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img src={capturedPhoto} alt="Captured Attendance" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-medium text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Photo Captured</span>
              </div>
            </div>
          ) : (
            // Live Camera View with Face Overlay
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Face Frame Circular Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Dark Mask Vignette around face frame */}
                <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-dashed border-blue-400/90 face-frame-pulse shadow-[0_0_50px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center text-center p-4">
                  <div className="w-full h-full rounded-full border-2 border-white/20"></div>
                </div>

                {/* Instruction banner */}
                <div className="mt-6 bg-black/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs text-gray-200 font-medium tracking-wide flex items-center space-x-2">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Position your face inside the frame</span>
                </div>
              </div>

              {/* Flip Camera Button */}
              <button
                onClick={toggleCameraFacing}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-colors border border-white/20"
                title="Switch Camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Verification Loading Overlay */}
          {isVerifying && (
            <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 space-y-4 z-20">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                <ShieldCheck className="w-8 h-8 text-blue-400 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm font-medium text-white">{verifyingText}</p>
              <p className="text-xs text-gray-400">Verifying session validity & student identity...</p>
            </div>
          )}
        </div>

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Bottom Control Actions */}
        <div className="p-5 bg-gray-900 border-t border-gray-800">
          {capturedPhoto ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRetake}
                disabled={isVerifying}
                className="w-full py-3 px-4 rounded-xl border border-gray-700 bg-gray-800 text-gray-200 font-semibold text-sm hover:bg-gray-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake</span>
              </button>
              <button
                onClick={handleConfirm}
                disabled={isVerifying}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Attendance</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <button
                onClick={handleCapture}
                disabled={!!permissionError}
                className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-white text-gray-900 font-bold shadow-xl border-4 border-blue-500 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none"
                title="Capture Photo"
              >
                <div className="w-12 h-12 rounded-full bg-gray-900 group-hover:bg-blue-600 transition-colors flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
