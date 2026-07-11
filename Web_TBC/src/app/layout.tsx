import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deteksi Tuberkulosis AI (DenseNet121)",
  description: "Aplikasi skrining Tuberkulosis dari citra Rontgen Thorax menggunakan Deep Learning.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  return (
    <ClerkProvider>
      <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100/60 via-slate-50 to-slate-50 text-slate-950 dark:from-slate-900/40 dark:via-slate-950 dark:to-slate-950 dark:text-slate-50">
          {/* Header/Navbar */}
          <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/60 backdrop-blur-md dark:border-slate-800/40 dark:bg-slate-950/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  {/* SVG Lung Logo matching the design */}
                  <svg className="h-7 w-7 text-cyan-600 dark:text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M7 4.5C4 6 2 9 2 13c0 4.5 3 6.5 5 7h3v-2.5c0-1.5-1-2-1.5-3.5S8.5 11 10 9V5c-1 0-2-.2-3-.5z" fill="currentColor" fillOpacity="0.1" />
                    <path d="M17 4.5C20 6 22 9 22 13c0 4.5-3 6.5-5 7h-3v-2.5c0-1.5 1-2 1.5-3.5S15.5 11 14 9V5c1 0 2-.2 3-.5z" fill="currentColor" fillOpacity="0.1" />
                    <circle cx="12" cy="12" r="2" className="animate-pulse fill-cyan-500 stroke-none" />
                  </svg>
                  <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-700 to-blue-800 bg-clip-text text-transparent dark:from-cyan-400 dark:to-blue-400">
                    TBC Detect.AI
                  </span>
                </Link>

                {/* Technology badge in the navbar center on desktop */}
                <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-400">
                  <span className="text-yellow-500">★</span> Teknologi AI Terbaru 2026
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Navigation Links for Authenticated users */}
                {userId && (
                  <nav className="hidden items-center gap-6 md:flex">
                    <Link
                      href="/"
                      className="text-sm font-semibold text-slate-600 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400"
                    >
                      Mulai Deteksi
                    </Link>
                    <Link
                      href="/history"
                      className="text-sm font-semibold text-slate-600 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400"
                    >
                      Riwayat Pemeriksaan
                    </Link>
                  </nav>
                )}

                {userId ? (
                  <div className="flex items-center gap-4">
                    {/* Mobile nav links */}
                    <nav className="flex items-center gap-3 md:hidden mr-1">
                      <Link href="/" className="text-xs font-bold text-slate-600 hover:text-cyan-600 dark:text-slate-300">
                        Upload
                      </Link>
                      <Link href="/history" className="text-xs font-bold text-slate-600 hover:text-cyan-600 dark:text-slate-300">
                        Riwayat
                      </Link>
                    </nav>
                    <UserButton />
                  </div>
                ) : (
                  <Link
                    href="/sign-in"
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Login Staff
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer with Medical Disclaimer */}
          <footer className="border-t border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                <strong className="text-amber-600 dark:text-amber-400 font-semibold">Disclaimer Medis:</strong> Hasil analisis dari aplikasi berbasis kecerdasan buatan (AI) ini merupakan alat bantu skrining awal dan bukan merupakan diagnosis medis final. Aplikasi ini tidak menggantikan konsultasi, pemeriksaan, serta diagnosis profesional dari dokter spesialis radiologi atau pulmonologi. Selalu konsultasikan hasil pemeriksaan dengan tenaga medis atau dokter ahli untuk penanganan medis lebih lanjut.
              </p>
              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                &copy; {new Date().getFullYear()} TB-Detect AI. Aplikasi Klasifikasi Rontgen Thorax untuk Deteksi Tuberkulosis.
              </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
