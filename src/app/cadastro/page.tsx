import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">Carregando…</div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
