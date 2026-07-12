"use client";

import { useState, useRef } from "react";
import { Upload, X, ShieldAlert, CheckCircle, AlertTriangle, FileText, RefreshCw, Layers } from "lucide-react";
import Image from "next/image";

interface PredictionResult {
  label: "Normal" | "Tuberculosis";
  confidence: number;
  raw_probability: number;
  heatmap_image?: string;
  superimposed_image?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    setError(null);
    setResult(null);

    // Limit to 5MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File terlalu besar. Maksimal ukuran file adalah 5MB.");
      return;
    }

    // Must be image
    if (!selectedFile.type.startsWith("image/")) {
      setError("Format file tidak valid. Silakan unggah gambar JPG atau PNG.");
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setLoadingStep("");
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    
    try {
      setLoadingStep("Menghubungi server klasifikasi AI (Hugging Face via Proxy)...");
      
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/predict-proxy", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server AI merespons dengan status ${response.status}`);
      }

      setLoadingStep("Memproses visualisasi Grad-CAM...");
      const data: PredictionResult = await response.json();
      setResult(data);

      setLoadingStep("Menyimpan hasil ke riwayat pemeriksaan...");
      const saveFormData = new FormData();
      saveFormData.append("original_image", file);
      saveFormData.append("label", data.label);
      saveFormData.append("confidence", data.confidence.toString());
      saveFormData.append("raw_probability", data.raw_probability.toString());
      
      if (data.heatmap_image) {
        saveFormData.append("heatmap_image", data.heatmap_image);
      }
      if (data.superimposed_image) {
        saveFormData.append("superimposed_image", data.superimposed_image);
      }

      const saveResponse = await fetch("/api/predictions", {
        method: "POST",
        body: saveFormData,
      });

      if (!saveResponse.ok) {
        const saveError = await saveResponse.json().catch(() => ({}));
        console.warn("Gagal menyimpan riwayat:", saveError.error);
      }

    } catch (err: any) {
      console.error("Analisis Error:", err);
      setError(err.message || "Terjadi kesalahan koneksi ke server AI.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero section matching mockup */}
      <div className="text-center mb-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50/60 px-4 py-1.5 text-xs font-semibold text-sky-700 dark:border-sky-950 dark:bg-sky-950/40 dark:text-sky-400 mb-6">
          <span className="text-yellow-500">★</span> Teknologi AI Terbaru 2026
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-[#0f766e] dark:text-cyan-400 sm:text-5xl max-w-2xl leading-tight">
          Deteksi Dini TBC Kurang dari 5 Detik
        </h1>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Unggah citra X-Ray paru-paru Anda dan dapatkan analisis instan dengan akurasi 98.5% menggunakan model DenseNet121.
        </p>
      </div>

      <div className="flex flex-col items-center gap-8">
        {/* Upload Container matching mockup exactly */}
        <div className="w-full max-w-xl">
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center">
            
            {!previewUrl ? (
              <div
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={handleSelectClick}
                className="group relative flex w-full h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-400/80 bg-slate-50/30 p-6 text-center transition hover:border-blue-500 hover:bg-blue-50/20 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-blue-400 dark:hover:bg-blue-950/10"
              >
                <div className="rounded-full bg-sky-500 p-4 text-white shadow-md transition group-hover:scale-105">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h3 className="mt-5 text-base font-bold text-slate-800 dark:text-white">
                  Upload X-Ray Disini
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Drag & drop image (JPG, PNG)
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="w-full relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="aspect-video relative w-full bg-slate-950">
                  <img
                    src={previewUrl}
                    alt="Pratinjau Rontgen"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="absolute right-3 top-3">
                  <button
                    onClick={handleReset}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur hover:bg-slate-900 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="bg-slate-50 p-4 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                    {file?.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {file ? (file.size / 1024 / 1024).toFixed(2) + " MB" : ""}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="w-full mt-4 flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/20 dark:text-red-400">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {file && !isLoading && !result && (
              <button
                onClick={handleAnalyze}
                className="mt-6 w-full flex h-11 items-center justify-center rounded-xl bg-sky-600 font-bold text-white shadow-md hover:bg-sky-700 transition"
              >
                Mulai Pemeriksaan
              </button>
            )}

            {isLoading && (
              <div className="mt-6 flex flex-col items-center justify-center py-4 text-center w-full">
                <RefreshCw className="h-7 w-7 text-sky-600 animate-spin mb-3" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {loadingStep || "Mempersiapkan analisis AI..."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        {result && (
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hasil Pemeriksaan</h2>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
              >
                <RefreshCw className="h-3 w-3" />
                Mulai Baru
              </button>
            </div>

            {/* Status Header */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl p-4 border ${
              result.label === "Tuberculosis"
                ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50"
                : "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50"
            }`}>
              <div className="shrink-0">
                {result.label === "Tuberculosis" ? (
                  <AlertTriangle className="h-9 w-9 text-red-600 dark:text-red-400" />
                ) : (
                  <CheckCircle className="h-9 w-9 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <h3 className={`text-base font-bold ${
                  result.label === "Tuberculosis" ? "text-red-800 dark:text-red-400" : "text-green-800 dark:text-green-400"
                }`}>
                  Terdeteksi: {result.label}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Skor Keyakinan (Confidence Score): <span className="font-bold">{result.confidence}%</span>
                </p>
              </div>
            </div>

            {/* Image Columns */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                Visualisasi Lokalisasi Grad-CAM
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Original Image */}
                <div className="flex flex-col gap-1.5">
                  <div className="aspect-square relative w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Citra Asli"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-center font-semibold text-slate-500 dark:text-slate-400">
                    Citra Rontgen Asli
                  </span>
                </div>

                {/* Heatmap Image */}
                <div className="flex flex-col gap-1.5">
                  <div className="aspect-square relative w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {result.heatmap_image && (
                      <img
                        src={result.heatmap_image}
                        alt="Grad-CAM Heatmap"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-center font-semibold text-slate-500 dark:text-slate-400">
                    Heatmap Grad-CAM
                  </span>
                </div>

                {/* Superimposed Image */}
                <div className="flex flex-col gap-1.5">
                  <div className="aspect-square relative w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {result.superimposed_image && (
                      <img
                        src={result.superimposed_image}
                        alt="Superimposed"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-center font-semibold text-slate-500 dark:text-slate-400">
                    Hasil Superimpose
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
