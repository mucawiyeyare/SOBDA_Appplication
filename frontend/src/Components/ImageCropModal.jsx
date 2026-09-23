import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Check,
  X,
  Move,
  Sparkles,
} from "lucide-react";

export default function ImageCropModal({
  imageSrc,
  onCancel,
  onCropComplete,
  isSaving = false,
  shape = "circle",
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isRect = shape === "rect";
  const VW = isRect ? 320 : 260;
  const VH = 260;
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 1, height: 1 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const touchDistanceRef = useRef(null);

  // Load natural dimensions
  const onImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImgNaturalSize({ width: naturalWidth, height: naturalHeight });
    setImageLoaded(true);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // Reset to default
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag & pinch-to-zoom handlers (Mobile phones)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      // Pinch gesture start
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current) {
      // Pinch zoom
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = currentDist - touchDistanceRef.current;
      setScale((prev) => Math.min(3, Math.max(0.5, prev + delta * 0.005)));
      touchDistanceRef.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setScale((prev) => Math.min(3, Math.max(0.5, prev + delta)));
  };

  // Global mouse up
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Export cropped circle image as compressed 400x400 Base64
  const handleApplyCrop = () => {
    if (!imageRef.current || !containerRef.current) return;

    const outW = isRect ? 800 : 400;
    const outH = isRect ? 600 : 400;
    const outputSize = outW;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Smooth rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Viewport circle size (260px in DOM)
    const ratio = outputSize / VW;

    // White background first, so nothing outside the crop turns black in the JPEG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);

    ctx.save();
    if (!isRect) {
      ctx.beginPath();
      ctx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    // Coordinate transforms
    ctx.translate(outW / 2, outH / 2);
    ctx.translate(position.x * ratio, position.y * ratio);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale * ratio, scale * ratio);

    // Calculate image render dimensions preserving aspect ratio
    const imgAspect = imgNaturalSize.width / imgNaturalSize.height;
    const fitHeight = imgAspect >= VW / VH;
    let drawWidth, drawHeight;

    if (fitHeight) {
      drawHeight = VH;
      drawWidth = VH * imgAspect;
    } else {
      drawWidth = VW;
      drawHeight = VW / imgAspect;
    }

    ctx.drawImage(
      imageRef.current,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    // Export as high quality JPEG (compact size ~50-80KB)
    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.88);
    onCropComplete(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-600 to-rose-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">Arrange Profile Photo</h3>
              <p className="text-xs text-red-100">Drag, zoom & rotate to fit your profile</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 flex flex-col items-center bg-slate-900">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            style={{ width: VW, height: VH }}
            className={`relative ${isRect ? "rounded-2xl" : "rounded-full"} overflow-hidden border-4 border-white/90 shadow-2xl cursor-grab active:cursor-grabbing select-none bg-slate-950 flex items-center justify-center touch-none`}
          >
            {/* Image being manipulated */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              onLoad={onImageLoad}
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                transformOrigin: "center center",
                maxWidth: "none",
                maxHeight: "none",
                width: imgNaturalSize.width / imgNaturalSize.height >= VW / VH ? "auto" : VW,
                height: imgNaturalSize.width / imgNaturalSize.height >= VW / VH ? VH : "auto",
                transition: isDragging ? "none" : "transform 0.05s ease-out",
              }}
              className="pointer-events-none"
            />

            {/* Grid overlay for alignment */}
            <div className={`absolute inset-0 pointer-events-none ${isRect ? "rounded-2xl" : "rounded-full"} border border-white/20 grid grid-cols-3 grid-rows-3`}>
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-white/10" />
              <div className="border-r border-white/10" />
              <div />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <Move className="w-3.5 h-3.5" />
            <span>Drag photo to center face or target area</span>
          </div>
        </div>

        {/* Controls Section */}
        <div className="p-5 bg-white space-y-4">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5 text-red-600" />
                Zoom
              </span>
              <span className="font-mono text-slate-500">{Math.round(scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-red-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setScale((prev) => Math.min(3, prev + 0.1))}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Tools: Rotate & Reset */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleRotate}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-red-600" />
              <span>Rotate 90°</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Reset position and zoom"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isSaving || !imageLoaded}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Profile Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
