import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Image, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function QRScannerModal({ isOpen, onClose }: Props) {
  const { navigate } = useRouter();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerId = 'menuqr-qr-viewfinder';

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Clean up scanner on modal close
  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {
          // cleanup
        }
        scannerRef.current = null;
      }
      setIsCameraActive(false);
      setStartingCamera(false);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScanSuccess = (decodedText: string) => {
    try {
      let targetSlug = '';
      if (decodedText.includes('/r/')) {
        const parts = decodedText.split('/r/');
        targetSlug = parts[1].split('/')[0].split('?')[0].trim();
      } else if (!decodedText.startsWith('http')) {
        targetSlug = decodedText.trim();
      }

      if (targetSlug) {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            onClose();
            navigate(`/r/${targetSlug.toLowerCase()}`);
          });
        } else {
          onClose();
          navigate(`/r/${targetSlug.toLowerCase()}`);
        }
      } else {
        window.location.href = decodedText;
      }
    } catch {
      setStatusMessage('Invalid QR format. Please try another code.');
    }
  };

  const handleStartCamera = async () => {
    if (isCameraActive) {
      // Stop camera
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
        setIsCameraActive(false);
        setStatusMessage('Camera stopped.');
      }
      return;
    }

    setStartingCamera(true);
    setStatusMessage(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      const scanner = scannerRef.current;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => handleScanSuccess(decodedText),
        () => {} // silent frame error
      );
      setIsCameraActive(true);
      setStatusMessage('Align QR code inside the viewfinder.');
    } catch (err: any) {
      console.warn('Camera error:', err);
      setIsCameraActive(false);
      setStatusMessage('Camera blocked or unavailable in preview. Use "Scan from photo" or type code below.');
    } finally {
      setStartingCamera(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage('Scanning selected photo...');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      const decodedText = await scannerRef.current.scanFile(file, false);
      handleScanSuccess(decodedText);
    } catch (err) {
      console.warn('File scan error:', err);
      setStatusMessage('No valid QR code found in photo. Please choose another image.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim().toLowerCase();
    if (clean) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      onClose();
      navigate(`/r/${clean}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#051F20]/85 backdrop-blur-md">
      <div className="bg-[#0B2B26] border border-[#235347] text-[#DAF1DE] w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-24px)]">
        {/* Sticky Header with visible Close Button */}
        <div className="shrink-0 px-4 py-3 border-b border-[#235347] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#8EB69B]" />
            <h3 className="font-heading font-bold text-base text-[#DAF1DE]">Scan Menu QR</h3>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#DAF1DE]/70 hover:text-[#DAF1DE] hover:bg-[#163832] transition-colors cursor-pointer"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrolls internally) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          {/* (a) Square viewfinder, max 45dvh */}
          <div className="relative w-full max-w-[260px] aspect-square max-h-[42dvh] mx-auto rounded-2xl overflow-hidden bg-[#051F20] border border-[#235347] flex items-center justify-center">
            <div id={containerId} className="w-full h-full flex items-center justify-center" />

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center pointer-events-none bg-[#051F20]/95">
                <div className="w-12 h-12 rounded-full bg-[#163832] border border-[#235347] flex items-center justify-center text-[#8EB69B]">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-[#DAF1DE]">Camera Inactive</p>
                <p className="text-[11px] text-[#DAF1DE]/60">Tap "Start camera" below or upload a photo.</p>
              </div>
            )}

            {isCameraActive && (
              <div className="absolute inset-6 pointer-events-none border-2 border-dashed border-[#8EB69B]/70 rounded-xl animate-pulse" />
            )}
          </div>

          {/* (b) Main buttons right under it */}
          <div className="space-y-2 max-w-[280px] mx-auto w-full">
            {/* Start / Stop Camera button */}
            <button
              onClick={handleStartCamera}
              disabled={startingCamera}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full btn-primary text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {startingCamera ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Accessing camera...</span>
                </>
              ) : isCameraActive ? (
                <>
                  <span>Stop camera</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Start camera</span>
                </>
              )}
            </button>

            {/* Scan from photo button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-full btn-secondary text-xs font-semibold flex items-center justify-center gap-2 hover:border-[#8EB69B] cursor-pointer transition-colors"
            >
              <Image className="w-4 h-4 text-[#8EB69B]" />
              <span>Scan from photo</span>
            </button>

            {/* Direct code fallback */}
            <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Or restaurant code (e.g. demo-bistro)"
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#163832] border border-[#235347] text-xs text-[#DAF1DE] placeholder:text-[#DAF1DE]/40 focus:outline-hidden focus:border-[#8EB69B]"
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl bg-[#235347] hover:bg-[#8EB69B] hover:text-[#051F20] text-xs font-bold text-[#DAF1DE] transition-colors cursor-pointer shrink-0"
              >
                Go
              </button>
            </form>
          </div>

          {/* (c) Status and permission notice at the very BOTTOM as one short line */}
          {statusMessage ? (
            <p className="text-[11px] text-center text-[#8EB69B] font-medium pt-1 px-2 leading-tight">
              {statusMessage}
            </p>
          ) : (
            <p className="text-[10px] text-center text-[#DAF1DE]/50 pt-1">
              Works with printed QR codes or screen photos.
            </p>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 p-3 border-t border-[#235347] bg-[#0B2B26] pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 rounded-full btn-secondary text-xs font-semibold hover:border-[#8EB69B] cursor-pointer transition-colors text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
