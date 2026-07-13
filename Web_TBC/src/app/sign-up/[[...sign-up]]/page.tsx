import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-4">
      {/* Background decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-green-100 opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-100 opacity-60 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-50 opacity-80 blur-2xl" />
      </div>

      {/* Dot grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, #86efac 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo + Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 shadow-lg shadow-green-200">
            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4.5C4 6 2 9 2 13c0 4.5 3 6.5 5 7h3v-2.5c0-1.5-1-2-1.5-3.5S8.5 11 10 9V5c-1 0-2-.2-3-.5z" fill="white" fillOpacity="0.25" />
              <path d="M17 4.5C20 6 22 9 22 13c0 4.5-3 6.5-5 7h-3v-2.5c0-1.5 1-2 1.5-3.5S15.5 11 14 9V5c1 0 2-.2 3-.5z" fill="white" fillOpacity="0.25" />
              <path d="M12 2v20" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6" />
              <circle cx="12" cy="11" r="1.5" fill="white" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight gradient-text">
              TBC Detect.AI
            </h1>
            <p className="mt-1 text-sm text-green-700/80">
              Daftar Akun Baru untuk Mulai Deteksi
            </p>
          </div>

          {/* Stats pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-semibold text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            DenseNet121 · Akurasi 98.5% · 2026
          </div>
        </div>

        {/* Clerk Sign-Up Card */}
        <div className="flex justify-center">
          <SignUp
            appearance={{
              variables: {
                colorPrimary: "#16a34a",
                colorBackground: "#ffffff",
                borderRadius: "12px",
                fontFamily: "Inter, sans-serif",
              },
              elements: {
                card: "shadow-xl border border-green-100 rounded-2xl",
                headerTitle: "text-green-900 font-extrabold",
                headerSubtitle: "text-green-700",
                formButtonPrimary:
                  "bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-sm font-bold normal-case shadow-md hover:shadow-green-200 transition-all",
                formFieldInput:
                  "border-green-200 focus:border-green-400 focus:ring-green-200 bg-green-50/50",
                formFieldLabel: "text-green-800 font-semibold text-sm",
                dividerLine: "bg-green-100",
                dividerText: "text-green-500",
                socialButtonsBlockButton:
                  "border-green-200 hover:bg-green-50 text-green-800 transition",
                footerActionLink: "text-green-600 hover:text-green-800 font-semibold",
                identityPreviewText: "text-green-800",
                identityPreviewEditButtonIcon: "text-green-600",
              },
            }}
          />
        </div>

        {/* Bottom note */}
        <p className="mt-6 text-center text-xs text-green-600/70">
          ⚠️ Khusus tenaga medis dan peneliti. Hasil bukan diagnosis medis final.
        </p>
      </div>
    </div>
  );
}
