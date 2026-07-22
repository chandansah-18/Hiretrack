import type { ReactNode } from "react";
import { Suspense } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Loader2 } from "lucide-react";

function SignupFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0b1120" }}>
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );
}

export default function SignupLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={<SignupFallback />}>
        {children}
      </Suspense>
    </AuthProvider>
  );
}
