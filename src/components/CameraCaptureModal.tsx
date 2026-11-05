'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const { language, t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported on this browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setCameraError(
        language === 'te'
          ? 'కెమెరా ప్రారంభించడం సాధ్యం కాలేదు. దయచేసి కెమెరా అనుమతులను తనిఖీ చేయండి లేదా ఫోటో అప్‌లోడ్ చేయండి.'
          : 'Unable to access camera. Please check camera permissions or upload an image file directly.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-stone-950 flex items-center justify-between border-b border-stone-800 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-lime-400" />
            <h3 className="font-bold text-sm">{t('cameraModal.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder or Captured Preview */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
          ) : cameraError ? (
            <div className="p-6 text-center space-y-2 text-red-400">
              <AlertCircle className="w-10 h-10 mx-auto" />
              <p className="text-xs">{cameraError}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Guidelines Overlay */}
          {!capturedImage && !cameraError && (
            <div className="absolute inset-8 border border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="text-[11px] text-white/80 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                {t('cameraModal.instruction')}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-around">
          {capturedImage ? (
            <>
              <button
                onClick={retakePhoto}
                className="px-5 py-2.5 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 text-xs font-semibold cursor-pointer"
              >
                {t('cameraModal.retake')}
              </button>
              <button
                onClick={confirmPhoto}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-emerald-950 font-black text-xs shadow-md hover:brightness-110 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{t('cameraModal.usePhoto')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={flipCamera}
                className="p-3 rounded-full bg-stone-800 text-stone-300 hover:bg-stone-700 cursor-pointer"
                title="Flip Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={takeSnapshot}
                disabled={!!cameraError}
                className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                title={t('cameraModal.snapPhoto')}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-600" />
              </button>

              <div className="w-11" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
