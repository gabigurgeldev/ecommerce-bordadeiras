import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-brown)]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
