import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            X-Ray TB Scanner
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Aplikasi Deteksi Tuberkulosis berbasis Deep Learning (DenseNet121)
          </p>
        </div>
        <div className="flex justify-center">
          <SignIn appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              card: 'shadow-xl border border-slate-200 dark:border-slate-800'
            }
          }} />
        </div>
      </div>
    </div>
  );
}
