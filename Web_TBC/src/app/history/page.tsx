"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileImage,
  Trash2,
  Download,
  Filter,
  Activity,
  TrendingUp,
  ClipboardList,
  Clock,
} from "lucide-react";

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

type FilterType = "all" | "Normal" | "Tuberculosis";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Summary stat card
function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border p-4 card-hover ${color}`}>
      <div className="flex items-center justify-between">
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-green-900">{value}</p>
      <p className="text-xs font-semibold text-green-700">{label}</p>
    </div>
  );
}

// Confidence mini bar
function MiniConfidenceBar({ confidence, label }: { confidence: number; label: string }) {
  const isTbc = label === "Tuberculosis";
  return (
    <div className="w-full mt-1">
      <div className="h-1.5 rounded-full w-full" style={{ background: isTbc ? "#fef2f2" : "#dcfce7" }}>
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{
            width: `${confidence}%`,
            background: isTbc
              ? "linear-gradient(90deg, #f87171, #dc2626)"
              : "linear-gradient(90deg, #22c55e, #16a34a)",
          }}
        />
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchPredictions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/predictions");
      if (!response.ok) throw new Error("Gagal mengambil data riwayat pemeriksaan.");
      const data = await response.json();
      setPredictions(data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Stats
  const stats = useMemo(() => {
    const total = predictions.length;
    const normal = predictions.filter((p) => p.label === "Normal").length;
    const tbc = predictions.filter((p) => p.label === "Tuberculosis").length;
    const latest = predictions[0]?.created_at
      ? formatDateShort(predictions[0].created_at)
      : "-";
    return { total, normal, tbc, latest };
  }, [predictions]);

  // Filtered list
  const filtered = useMemo(() => {
    if (filter === "all") return predictions;
    return predictions.filter((p) => p.label === filter);
  }, [predictions, filter]);

  // Delete single prediction
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/predictions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus.");
      setPredictions((prev) => prev.filter((p) => p.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (predictions.length === 0) return;
    const headers = ["ID", "Tanggal", "Label", "Confidence (%)", "Raw Probability"];
    const rows = predictions.map((p) => [
      p.id,
      formatDate(p.created_at),
      p.label,
      p.confidence.toFixed(2),
      p.raw_probability.toFixed(4),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((row) => row.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `riwayat-deteksi-tbc-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── PAGE HEADER ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-bold text-green-700 mb-3">
            <ClipboardList className="h-3.5 w-3.5" />
            Riwayat Pemeriksaan
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-green-900">
            Semua Hasil Deteksi Anda
          </h1>
          <p className="mt-1 text-sm text-green-700/80">
            Histori seluruh pemindaian X-Ray yang pernah dianalisis oleh AI.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchPredictions}
            disabled={isLoading}
            id="btn-refresh"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-white px-3 text-xs font-semibold text-green-700 hover:bg-green-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </button>
          <button
            onClick={handleExportCSV}
            disabled={predictions.length === 0}
            id="btn-export-csv"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg btn-green px-3 text-xs font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── SUMMARY STAT CARDS ───────────────────────────────── */}
      {!isLoading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            icon={<Activity className="h-5 w-5 text-green-600" />}
            value={stats.total}
            label="Total Pemeriksaan"
            color="bg-green-50 border-green-200"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
            value={stats.normal}
            label="Hasil Normal"
            color="bg-emerald-50 border-emerald-200"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            value={stats.tbc}
            label="Terdeteksi TBC"
            color="bg-red-50 border-red-200"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            value={stats.latest}
            label="Pemeriksaan Terakhir"
            color="bg-blue-50 border-blue-200"
          />
        </div>
      )}

      {/* ── FILTER BAR ───────────────────────────────────────── */}
      {!isLoading && !error && predictions.length > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <Filter className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-xs font-bold text-green-700 mr-1">Filter:</span>
          {(["all", "Normal", "Tuberculosis"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-bold transition-all ${
                filter === f
                  ? f === "Tuberculosis"
                    ? "bg-red-600 text-white shadow-sm"
                    : f === "Normal"
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-green-900 text-white shadow-sm"
                  : "bg-white border border-green-200 text-green-700 hover:bg-green-50"
              }`}
            >
              {f === "all" ? "Semua" : f}
              {f !== "all" && (
                <span className={`ml-1.5 rounded-full px-1.5 text-[10px] font-bold ${
                  filter === f ? "bg-white/20" : "bg-green-100 text-green-700"
                }`}>
                  {f === "Normal" ? stats.normal : stats.tbc}
                </span>
              )}
            </button>
          ))}
          {filter !== "all" && (
            <span className="text-xs text-green-600 ml-2">
              Menampilkan {filtered.length} hasil
            </span>
          )}
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="h-9 w-9 text-green-600 animate-spin" />
          <p className="text-sm font-semibold text-green-800">Memuat riwayat pemeriksaan...</p>
          {/* Skeletons */}
          <div className="w-full max-w-3xl flex flex-col gap-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl skeleton" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-red-800 mb-4">{error}</p>
          <button
            onClick={fetchPredictions}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba Lagi
          </button>
        </div>
      ) : predictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-green-200 bg-green-50/30">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <FileImage className="h-10 w-10 text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-green-900 mb-2">Belum Ada Riwayat</h3>
          <p className="text-sm text-green-700/70 text-center max-w-xs">
            Anda belum pernah melakukan analisis X-Ray. Hasil analisis akan otomatis tersimpan di sini.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl btn-green px-5 text-sm font-bold shadow-md"
          >
            Mulai Deteksi Sekarang
          </a>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-green-100 bg-green-50/30">
          <Filter className="h-10 w-10 text-green-300 mb-3" />
          <p className="text-sm font-semibold text-green-800">Tidak ada data dengan filter ini.</p>
          <button
            onClick={() => setFilter("all")}
            className="mt-3 text-xs font-bold text-green-600 hover:underline"
          >
            Tampilkan semua
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const isConfirmingDelete = confirmDeleteId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-green-200"
              >
                {/* Collapsed header */}
                <div className="flex items-center gap-3 p-4">
                  {/* Thumbnail */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-green-100 cursor-pointer hover:opacity-90 transition"
                  >
                    <img
                      src={item.original_image_url}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.label === "Tuberculosis"
                            ? "badge-tbc"
                            : "badge-normal"
                        }`}
                      >
                        {item.label === "Tuberculosis" ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        {item.label}
                      </span>
                      <span className="text-xs font-bold text-green-900">
                        {item.confidence}% confidence
                      </span>
                    </div>
                    <MiniConfidenceBar confidence={item.confidence} label={item.label} />
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-green-600/80">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Delete button */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-2 py-1">
                        <span className="text-[10px] font-bold text-red-700">Hapus?</span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting}
                          className="text-[10px] font-bold text-white bg-red-600 rounded-md px-1.5 py-0.5 hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {isDeleting ? "..." : "Ya"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] font-bold text-red-600 hover:underline"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-green-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Hapus riwayat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-green-400 hover:text-green-700 hover:bg-green-50 transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-green-100 bg-green-50/40 p-5 animate-fade-in-up">
                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="rounded-xl bg-white border border-green-100 p-3 text-center">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Label</p>
                        <p className={`text-sm font-extrabold mt-0.5 ${item.label === "Tuberculosis" ? "text-red-700" : "text-green-700"}`}>
                          {item.label}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white border border-green-100 p-3 text-center">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Confidence</p>
                        <p className="text-sm font-extrabold text-green-900 mt-0.5">{item.confidence}%</p>
                      </div>
                      <div className="rounded-xl bg-white border border-green-100 p-3 text-center">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Raw Prob.</p>
                        <p className="text-sm font-extrabold text-green-900 mt-0.5">{(item.raw_probability * 100).toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Images */}
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-3 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Visualisasi Grad-CAM
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { url: item.original_image_url, label: "Citra Asli" },
                        { url: item.heatmap_image_url, label: "Heatmap Grad-CAM" },
                        { url: item.superimposed_image_url, label: "Superimpose" },
                      ].map((img, i) => (
                        <div key={i} className="flex flex-col gap-1.5">
                          {img.url ? (
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aspect-square w-full overflow-hidden rounded-xl bg-slate-900 border border-green-100 hover:opacity-90 transition shadow-sm block"
                            >
                              <img
                                src={img.url}
                                alt={img.label}
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ) : (
                            <div className="aspect-square w-full rounded-xl bg-green-100 border border-green-200 flex items-center justify-center">
                              <FileImage className="h-8 w-8 text-green-300" />
                            </div>
                          )}
                          <span className="text-[10px] text-center font-bold text-green-600 uppercase tracking-wider">
                            {img.label}
                          </span>
                        </div>
                      ))}
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
