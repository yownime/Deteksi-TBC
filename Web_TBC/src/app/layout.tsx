import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "TBC Detect AI — Deteksi Tuberkulosis dari X-Ray",
  description:
    "Aplikasi skrining Tuberkulosis dari citra Rontgen Thorax menggunakan Deep Learning DenseNet121 dengan akurasi 98.5%.",
  keywords: ["tuberkulosis", "TBC", "deteksi", "AI", "x-ray", "rontgen", "DenseNet121"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  return (
    <ClerkProvider>
      <html lang="id" className={`${inter.variable} h-full`}>
        <body className="flex min-h-screen flex-col bg-white text-green-950">
          {/* ── HEADER ──────────────────────────────────────── */}
          <header className="sticky top-0 z-50 w-full border-b border-green-100 bg-white/90 backdrop-blur-md shadow-sm">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

              {/* Left — Logo + Badge */}
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2.5 group">
                  {/* Animated Lung Icon */}
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 shadow-md group-hover:shadow-green-300 transition-shadow duration-300">
                    <svg
                      className="h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 4.5C4 6 2 9 2 13c0 4.5 3 6.5 5 7h3v-2.5c0-1.5-1-2-1.5-3.5S8.5 11 10 9V5c-1 0-2-.2-3-.5z" fill="white" fillOpacity="0.25" />
                      <path d="M17 4.5C20 6 22 9 22 13c0 4.5-3 6.5-5 7h-3v-2.5c0-1.5 1-2 1.5-3.5S15.5 11 14 9V5c1 0 2-.2 3-.5z" fill="white" fillOpacity="0.25" />
                      <path d="M12 2v20" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6" />
                      <circle cx="12" cy="11" r="1.5" fill="white" className="animate-pulse" />
                    </svg>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-base font-bold tracking-tight gradient-text">
                      TBC Detect.AI
                    </span>
                    <span className="text-[10px] font-medium text-green-600 leading-tight">
                      DenseNet121 Model
                    </span>
                  </div>
                </Link>

                {/* AI Badge */}
                <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Akurasi 98.5% · 2026
                </div>
              </div>

              {/* Right — Nav + User */}
              <div className="flex items-center gap-4">
                {userId && (
                  <>
                    {/* Desktop nav */}
                    <nav className="hidden items-center gap-1 md:flex">
                      <Link
                        href="/"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 hover:text-green-800 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Mulai Deteksi
                      </Link>
                      <Link
                        href="/history"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 hover:text-green-800 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Riwayat
                      </Link>
                    </nav>

                    {/* Mobile nav */}
                    <nav className="flex items-center gap-2 md:hidden">
                      <Link href="/" className="p-2 rounded-lg text-green-700 hover:bg-green-50 transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </Link>
                      <Link href="/history" className="p-2 rounded-lg text-green-700 hover:bg-green-50 transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </Link>
                    </nav>
                  </>
                )}

                {userId ? (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-px bg-green-100 hidden md:block" />
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "h-8 w-8 ring-2 ring-green-200 ring-offset-1",
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/sign-in"
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-green-200 bg-white px-4 text-xs font-bold text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/sign-up"
                      className="inline-flex h-9 items-center justify-center rounded-lg btn-green px-4 text-xs text-white font-bold shadow-sm"
                    >
                      Daftar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── MAIN ────────────────────────────────────────── */}
          <main className="flex-1 bg-gradient-to-b from-green-50/60 via-white to-white">
            {children}
          </main>

          {/* ── FOOTER ──────────────────────────────────────── */}
          <footer className="border-t border-green-100 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
                {/* Brand */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-700">
                      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 4.5C4 6 2 9 2 13c0 4.5 3 6.5 5 7h3v-2.5c0-1.5-1-2-1.5-3.5S8.5 11 10 9V5c-1 0-2-.2-3-.5z" fill="white" fillOpacity="0.3" />
                        <path d="M17 4.5C20 6 22 9 22 13c0 4.5-3 6.5-5 7h-3v-2.5c0-1.5 1-2 1.5-3.5S15.5 11 14 9V5c1 0 2-.2 3-.5z" fill="white" fillOpacity="0.3" />
                      </svg>
                    </div>
                    <span className="font-bold gradient-text">TBC Detect.AI</span>
                  </div>
                  <p className="text-xs text-green-700/70 max-w-xs leading-relaxed">
                    Sistem skrining TBC berbasis AI menggunakan arsitektur DenseNet121 yang dilatih pada dataset rontgen thorax.
                  </p>
                </div>

                {/* Tech Info */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Teknologi</p>
                  <div className="flex flex-wrap gap-2">
                    {["DenseNet121", "Grad-CAM", "Next.js", "Supabase", "Clerk Auth"].map((tech) => (
                      <span key={tech} className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong className="font-bold">⚠️ Disclaimer Medis:</strong> Hasil analisis dari aplikasi AI ini merupakan alat bantu skrining awal dan <strong>bukan diagnosis medis final</strong>. Aplikasi ini tidak menggantikan konsultasi dari dokter spesialis radiologi atau pulmonologi. Selalu konsultasikan hasil dengan tenaga medis profesional.
                </p>
              </div>

              <p className="text-xs text-green-600/60 text-center">
                © {new Date().getFullYear()} TBC Detect AI — Sistem Klasifikasi Rontgen Thorax untuk Deteksi Tuberkulosis. Skripsi Penelitian 2026.
              </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
