"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  X,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Printer,
  Info,
  Activity,
  Brain,
  Database,
  Microscope,
  ChevronRight,
} from "lucide-react";

interface PredictionResult {
  label: "Normal" | "Tuberculosis";
  confidence: number;
  raw_probability: number;
  heatmap_image?: string;
  superimposed_image?: string;
}

// Helper: interpret confidence level
function getConfidenceInterpretation(label: string, confidence: number) {
  if (confidence >= 90) {
    return label === "Normal"
      ? { text: "Paru-paru tampak sangat normal. Tidak ditemukan indikasi TBC yang signifikan.", level: "high" }
      : { text: "Indikasi kuat adanya pola Tuberkulosis. Segera lakukan konfirmasi dengan dokter spesialis.", level: "high" };
  } else if (confidence >= 75) {
    return label === "Normal"
      ? { text: "Kondisi paru-paru terlihat baik. Pemeriksaan rutin tetap dianjurkan.", level: "medium" }
      : { text: "Terdapat pola yang mencurigakan. Direkomendasikan segera berkonsultasi dengan dokter.", level: "medium" };
  } else {
    return label === "Normal"
      ? { text: "Hasil cenderung normal, namun tingkat keyakinan rendah. Disarankan pemeriksaan ulang.", level: "low" }
      : { text: "Hasil menunjukkan kemungkinan TBC, namun perlu konfirmasi lebih lanjut.", level: "low" };
  }
}

// Confidence bar component
function ConfidenceBar({ confidence, label }: { confidence: number; label: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(confidence), 100);
    return () => clearTimeout(t);
  }, [confidence]);

  const isTbc = label === "Tuberculosis";
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-green-800">Confidence Score</span>
        <span className={`text-sm font-extrabold ${isTbc ? "text-red-600" : "text-green-600"}`}>
          {confidence}%
        </span>
      </div>
      <div className="confidence-bar-track w-full" style={{ background: isTbc ? "#fef2f2" : "#dcfce7" }}>
        <div
          className={isTbc ? "confidence-bar-fill-tbc" : "confidence-bar-fill-normal"}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    setError(null);
    setResult(null);
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File terlalu besar. Maksimal ukuran file adalah 5MB.");
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      setError("Format file tidak valid. Silakan unggah gambar JPG atau PNG.");
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const handleReset = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setLoadingStep("");
    setLoadingProgress(0);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setLoadingProgress(10);

    try {
      setLoadingStep("Menghubungi server AI (Hugging Face)...");
      setLoadingProgress(25);

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
      setLoadingProgress(65);
      const data: PredictionResult = await response.json();
      setResult(data);

      setLoadingStep("Menyimpan ke riwayat pemeriksaan...");
      setLoadingProgress(85);

      const saveFormData = new FormData();
      saveFormData.append("original_image", file);
      saveFormData.append("label", data.label);
      saveFormData.append("confidence", data.confidence.toString());
      saveFormData.append("raw_probability", data.raw_probability.toString());
      if (data.heatmap_image) saveFormData.append("heatmap_image", data.heatmap_image);
      if (data.superimposed_image) saveFormData.append("superimposed_image", data.superimposed_image);

      const saveResponse = await fetch("/api/predictions", {
        method: "POST",
        body: saveFormData,
      });

      if (!saveResponse.ok) {
        const saveError = await saveResponse.json().catch(() => ({}));
        console.warn("Gagal menyimpan riwayat:", saveError.error);
      }

      setLoadingProgress(100);
    } catch (err: any) {
      console.error("Analisis Error:", err);
      setError(err.message || "Terjadi kesalahan koneksi ke server AI.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const interpretation = result
    ? getConfidenceInterpretation(result.label, result.confidence)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── HERO ───────────────────────────────────────────── */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-xs font-bold text-green-700 mb-5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse inline-block" />
          Model DenseNet121 · Akurasi 98.5% · 2026
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight mb-4">
          <span className="gradient-text">Deteksi TBC dari X-Ray</span>
          <br />
          <span className="text-green-900">dalam Hitungan Detik</span>
        </h1>
        <p className="text-base text-green-700/80 max-w-2xl mx-auto leading-relaxed">
          Unggah citra rontgen thorax dan dapatkan analisis instan didukung visualisasi{" "}
          <strong>Grad-CAM</strong> untuk melihat area yang diperhatikan model AI.
        </p>
      </div>

      {/* ── STATS BAR ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { icon: <Brain className="h-5 w-5 text-green-600" />, value: "98.5%", label: "Akurasi Model", bg: "bg-green-50 border-green-200" },
          { icon: <Activity className="h-5 w-5 text-emerald-600" />, value: "DenseNet121", label: "Arsitektur AI", bg: "bg-emerald-50 border-emerald-200" },
          { icon: <Database className="h-5 w-5 text-teal-600" />, value: "Grad-CAM", label: "Visualisasi XAI", bg: "bg-teal-50 border-teal-200" },
          { icon: <Microscope className="h-5 w-5 text-green-700" />, value: "< 5 Detik", label: "Waktu Analisis", bg: "bg-green-50 border-green-200" },
        ].map((stat, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 card-hover ${stat.bg}`}
          >
            {stat.icon}
            <span className="text-sm font-extrabold text-green-900">{stat.value}</span>
            <span className="text-[11px] font-medium text-green-600 text-center">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-8">
        {/* ── UPLOAD CARD ────────────────────────────────────── */}
        <div className="w-full max-w-xl">
          <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-md" style={{ boxShadow: "0 4px 24px rgba(22, 163, 74, 0.08)" }}>

            {/* How to use steps */}
            {!previewUrl && !result && (
              <div className="flex items-center justify-center gap-4 mb-5 pb-5 border-b border-green-50">
                {[
                  { num: "1", text: "Upload X-Ray" },
                  { num: "2", text: "Analisis AI" },
                  { num: "3", text: "Lihat Hasil" },
                ].map((step, i, arr) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-7 w-7 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold text-white">
                        {step.num}
                      </div>
                      <span className="text-[10px] font-semibold text-green-700">{step.text}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <ChevronRight className="h-4 w-4 text-green-300 -mt-3 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!previewUrl ? (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group flex w-full h-60 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                  isDragging
                    ? "border-green-500 bg-green-50 scale-[1.01]"
                    : "border-green-300 bg-green-50/30 hover:border-green-500 hover:bg-green-50"
                }`}
              >
                <div className={`rounded-2xl p-4 mb-4 transition-all duration-200 ${isDragging ? "bg-green-600 scale-110" : "bg-green-500 group-hover:bg-green-600 group-hover:scale-105"}`}
                  style={{ boxShadow: "0 4px 16px rgba(22, 163, 74, 0.4)" }}>
                  <Upload className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-sm font-bold text-green-900">
                  {isDragging ? "Lepaskan file di sini!" : "Drag & Drop X-Ray Disini"}
                </h3>
                <p className="mt-1 text-xs text-green-600/80">
                  atau klik untuk memilih file · JPG, PNG · Maks. 5MB
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
              <div className="w-full relative overflow-hidden rounded-xl border border-green-200">
                <div className="aspect-video relative w-full bg-slate-950">
                  <img src={previewUrl} alt="Pratinjau Rontgen" className="h-full w-full object-contain" />
                </div>
                <button
                  onClick={handleReset}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-green-800 backdrop-blur hover:bg-white transition shadow-md"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="bg-green-50 px-4 py-3 border-t border-green-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-green-800 truncate max-w-[200px]">{file?.name}</span>
                  <span className="text-[10px] text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded-full">
                    {file ? (file.size / 1024 / 1024).toFixed(2) + " MB" : ""}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Analyze button */}
            {file && !isLoading && !result && (
              <button
                id="btn-analyze"
                onClick={handleAnalyze}
                className="mt-5 w-full flex h-12 items-center justify-center gap-2 rounded-xl btn-green text-sm font-bold shadow-lg"
              >
                <Microscope className="h-5 w-5" />
                Mulai Analisis AI
              </button>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="mt-5 flex flex-col items-center gap-3 py-4">
                <RefreshCw className="h-8 w-8 text-green-600 animate-spin" />
                <p className="text-xs font-semibold text-green-800 text-center">{loadingStep || "Mempersiapkan analisis AI..."}</p>
                {/* Progress bar */}
                <div className="w-full confidence-bar-track">
                  <div
                    className="confidence-bar-fill-normal"
                    style={{ width: `${loadingProgress}%`, transition: "width 0.4s ease" }}
                  />
                </div>
                <p className="text-[10px] text-green-600">{loadingProgress}%</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RESULT PANEL ───────────────────────────────────── */}
        {result && interpretation && (
          <div
            id="result-section"
            className="w-full max-w-4xl rounded-2xl border border-green-100 bg-white shadow-lg animate-fade-in-up"
            style={{ boxShadow: "0 8px 40px rgba(22, 163, 74, 0.1)" }}
          >
            {/* Result header */}
            <div className="flex items-center justify-between border-b border-green-100 px-6 py-4">
              <h2 className="text-lg font-extrabold text-green-900">Hasil Analisis AI</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Analisis Baru
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-6">
              {/* Status badge */}
              <div
                className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl p-5 border ${
                  result.label === "Tuberculosis"
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                  result.label === "Tuberculosis" ? "bg-red-100" : "bg-green-100"
                }`}>
                  {result.label === "Tuberculosis" ? (
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className={`text-xl font-extrabold ${
                      result.label === "Tuberculosis" ? "text-red-800" : "text-green-800"
                    }`}>
                      {result.label === "Tuberculosis" ? "⚠️ Terdeteksi TBC" : "✅ Hasil Normal"}
                    </h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      interpretation.level === "high"
                        ? result.label === "Tuberculosis" ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
                        : interpretation.level === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      Keyakinan {interpretation.level === "high" ? "Tinggi" : interpretation.level === "medium" ? "Sedang" : "Rendah"}
                    </span>
                  </div>
                  <p className={`text-sm ${result.label === "Tuberculosis" ? "text-red-700" : "text-green-700"}`}>
                    {interpretation.text}
                  </p>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-green-50 border border-green-100 p-3">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">Confidence</p>
                  <p className="text-2xl font-extrabold text-green-900">{result.confidence}%</p>
                </div>
                <div className="rounded-xl bg-green-50 border border-green-100 p-3">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">Raw Probability</p>
                  <p className="text-2xl font-extrabold text-green-900">{(result.raw_probability * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-xl bg-green-50 border border-green-100 p-3 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">Prediksi</p>
                  <p className={`text-lg font-extrabold ${result.label === "Tuberculosis" ? "text-red-700" : "text-green-700"}`}>
                    {result.label}
                  </p>
                </div>
              </div>

              {/* Confidence bar */}
              <ConfidenceBar confidence={result.confidence} label={result.label} />

              {/* Recommendation */}
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-800 mb-1">Rekomendasi Tindak Lanjut</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {result.label === "Tuberculosis"
                      ? "Segera lakukan pemeriksaan lebih lanjut dengan dokter spesialis paru (pulmonologi). Diperlukan pemeriksaan sputum BTA, tes Mantoux, dan/atau CT-Scan untuk konfirmasi diagnosis."
                      : "Lanjutkan pola hidup sehat. Pemeriksaan rutin tiap 6–12 bulan dianjurkan, terutama jika ada riwayat kontak dengan penderita TBC."}
                  </p>
                </div>
              </div>

              {/* Grad-CAM Visualization */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-green-600 mb-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                  Visualisasi Grad-CAM (Explainable AI)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { src: previewUrl, label: "Citra Rontgen Asli", alt: "Citra Asli" },
                    { src: result.heatmap_image, label: "Heatmap Grad-CAM", alt: "Heatmap" },
                    { src: result.superimposed_image, label: "Hasil Superimpose", alt: "Superimposed" },
                  ].map((img, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-950 border border-green-100 shadow-sm">
                        {img.src && (
                          <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <span className="text-[10px] text-center font-bold text-green-600 uppercase tracking-wider">
                        {img.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── INFO SECTION ───────────────────────────────────── */}
        {!result && (
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: "🫁",
                  title: "Apa itu TBC?",
                  desc: "Tuberkulosis (TBC) adalah penyakit menular yang disebabkan bakteri Mycobacterium tuberculosis, umumnya menyerang paru-paru.",
                },
                {
                  icon: "🤖",
                  title: "Bagaimana AI Bekerja?",
                  desc: "Model DenseNet121 dilatih pada ribuan citra rontgen thorax untuk membedakan pola normal dan TBC dengan akurasi tinggi.",
                },
                {
                  icon: "🔬",
                  title: "Apa itu Grad-CAM?",
                  desc: "Gradient-weighted Class Activation Mapping adalah teknik visualisasi yang menunjukkan area paru-paru mana yang diperhatikan AI.",
                },
              ].map((card, i) => (
                <div key={i} className="rounded-2xl border border-green-100 bg-white p-5 card-hover shadow-sm">
                  <div className="text-3xl mb-3">{card.icon}</div>
                  <h3 className="text-sm font-bold text-green-900 mb-2">{card.title}</h3>
                  <p className="text-xs text-green-700/80 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
