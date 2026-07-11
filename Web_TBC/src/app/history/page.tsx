"use client";

import { useEffect, useState } from "react";
import { Layers, Calendar, ChevronRight, ChevronDown, CheckCircle, AlertTriangle, RefreshCw, FileImage } from "lucide-react";

interface Prediction {
  id: string;
  created_at: string;
  original_image_url: string;
  heatmap_image_url: string | null;
  superimposed_image_url: string | null;
  label: "Normal" | "Tuberculosis";
  confidence: number;
  raw_probability: number;
}

export default function HistoryPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPredictions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/predictions");
      if (!response.ok) {
        throw new Error("Gagal mengambil data riwayat pemeriksaan.");
      }
      const data = await response.json();
      setPredictions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Riwayat Pemeriksaan
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Daftar seluruh hasil pemindaian X-Ray yang pernah Anda lakukan.
          </p>
        </div>
        <button
          onClick={fetchPredictions}
          disabled={isLoading}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>

      {/* Main content area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Memuat riwayat pemeriksaan...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm font-semibold text-red-800 dark:text-red-400">{error}</p>
          <button
            onClick={fetchPredictions}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
          >
            Coba Lagi
          </button>
        </div>
      ) : predictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
          <FileImage className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum Ada Riwayat</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Anda belum pernah melakukan analisis rontgen thorax. Hasil analisis Anda akan otomatis tersimpan di sini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {predictions.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Collapsed view header */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="flex cursor-pointer items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <img
                        src={item.original_image_url}
                        alt="Thumbnail"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.label === "Tuberculosis"
                            ? "bg-red-50 text-red-700 dark:bg-red-950/45 dark:text-red-400"
                            : "bg-green-50 text-green-700 dark:bg-green-950/45 dark:text-green-400"
                        }`}>
                          {item.label === "Tuberculosis" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {item.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {item.confidence}% Confidence
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400 dark:text-slate-600">
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/40 p-6 dark:border-slate-800 dark:bg-slate-900/40">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                      Detail Citra Rontgen & Grad-CAM Heatmap
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Original Image */}
                      <div className="flex flex-col gap-1.5">
                        <a
                          href={item.original_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square relative w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-slate-800 hover:opacity-90 transition"
                        >
                          <img
                            src={item.original_image_url}
                            alt="Citra Asli"
                            className="h-full w-full object-cover"
                          />
                        </a>
                        <span className="text-[10px] text-center font-semibold text-slate-500 uppercase tracking-wider">
                          Citra Asli
                        </span>
                      </div>

                      {/* Heatmap Image */}
                      <div className="flex flex-col gap-1.5">
                        {item.heatmap_image_url ? (
                          <a
                            href={item.heatmap_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square relative w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-slate-800 hover:opacity-90 transition"
                          >
                            <img
                              src={item.heatmap_image_url}
                              alt="Grad-CAM Heatmap"
                              className="h-full w-full object-cover"
                            />
                          </a>
                        ) : (
                          <div className="aspect-square w-full rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                            Tidak Ada Heatmap
                          </div>
                        )}
                        <span className="text-[10px] text-center font-semibold text-slate-500 uppercase tracking-wider">
                          Heatmap Grad-CAM
                        </span>
                      </div>

                      {/* Superimposed Image */}
                      <div className="flex flex-col gap-1.5">
                        {item.superimposed_image_url ? (
                          <a
                            href={item.superimposed_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square relative w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-200 dark:border-slate-800 hover:opacity-90 transition"
                          >
                            <img
                              src={item.superimposed_image_url}
                              alt="Superimposed"
                              className="h-full w-full object-cover"
                            />
                          </a>
                        ) : (
                          <div className="aspect-square w-full rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                            Tidak Ada Superimpose
                          </div>
                        )}
                        <span className="text-[10px] text-center font-semibold text-slate-500 uppercase tracking-wider">
                          Hasil Superimpose
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
