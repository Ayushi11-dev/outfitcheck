import { useState, useRef } from "react";

const feedbacks = [
  { rating: "🔥 Fire", message: "This outfit is absolutely on point! The colors complement each other perfectly.", score: 95 },
  { rating: "✨ Good", message: "Solid look! Consider swapping the shoes for something bolder to elevate it.", score: 78 },
  { rating: "👍 Decent", message: "The fit works but the color palette feels a bit flat. Try adding an accessory.", score: 62 },
];

export default function FitCheckPage() {
  const [image, setImage] = useState(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();
  const videoRef = useRef();
  const [cameraOn, setCameraOn] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setImage(e.target.result);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const startCamera = async () => {
    setCameraOn(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const takePicture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    setImage(canvas.toDataURL("image/jpeg"));
    videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setCameraOn(false);
    setResult(null);
  };

  const checkFit = () => {
    if (!image) return;
    setChecking(true);
    setTimeout(() => {
      setResult(feedbacks[Math.floor(Math.random() * feedbacks.length)]);
      setChecking(false);
    }, 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#28251d]">Fit Check</h2>
        <p className="text-sm text-[#7a7974]">Upload or take a photo — AI will rate your outfit</p>
      </div>

      {/* Upload / Camera */}
      {!image && !cameraOn && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => fileRef.current.click()}
            className="bg-white border-2 border-dashed border-[#dcd9d5] rounded-2xl py-10 flex flex-col items-center gap-3 hover:border-[#01696f] hover:bg-[#f7f6f2] transition-all"
          >
            <span className="text-3xl">🖼️</span>
            <p className="text-sm font-medium text-[#28251d]">Upload Photo</p>
            <p className="text-xs text-[#7a7974]">JPG, PNG, WEBP</p>
          </button>
          <button
            onClick={startCamera}
            className="bg-white border-2 border-dashed border-[#dcd9d5] rounded-2xl py-10 flex flex-col items-center gap-3 hover:border-[#01696f] hover:bg-[#f7f6f2] transition-all"
          >
            <span className="text-3xl">📸</span>
            <p className="text-sm font-medium text-[#28251d]">Take Photo</p>
            <p className="text-xs text-[#7a7974]">Use your camera</p>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Camera View */}
      {cameraOn && (
        <div className="bg-black rounded-2xl overflow-hidden relative">
          <video ref={videoRef} autoPlay className="w-full rounded-2xl" />
          <button onClick={takePicture} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full border-4 border-[#01696f] hover:scale-105 transition-all" />
        </div>
      )}

      {/* Preview + Check */}
      {image && (
        <div className="bg-white rounded-2xl border border-[#ece9e4] overflow-hidden">
          <img src={image} alt="outfit" className="w-full max-h-80 object-cover" />
          <div className="p-4 flex gap-3">
            <button onClick={() => { setImage(null); setResult(null); }}
              className="flex-1 py-2.5 rounded-xl border border-[#dcd9d5] text-sm text-[#7a7974] hover:bg-[#f7f6f2] transition-all">
              Retake
            </button>
            <button onClick={checkFit} disabled={checking}
              className="flex-1 py-2.5 rounded-xl bg-[#01696f] text-white text-sm hover:bg-[#0c4e54] transition-all disabled:opacity-60">
              {checking ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⟳</span> Checking...</span> : "✨ Check My Fit"}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl border border-[#ece9e4] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold text-[#28251d]">{result.rating}</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-[#f3f0ec] rounded-full overflow-hidden">
                <div className="h-full bg-[#01696f] rounded-full transition-all duration-1000" style={{ width: `${result.score}%` }} />
              </div>
              <span className="text-sm font-semibold text-[#01696f]">{result.score}/100</span>
            </div>
          </div>
          <p className="text-sm text-[#7a7974] leading-relaxed">{result.message}</p>
          <button onClick={() => { setImage(null); setResult(null); }}
            className="w-full py-2.5 bg-[#01696f] text-white text-sm rounded-xl hover:bg-[#0c4e54] transition-all">
            Check Another Fit
          </button>
        </div>
      )}
    </div>
  );
}