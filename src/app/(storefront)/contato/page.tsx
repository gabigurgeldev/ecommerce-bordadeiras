import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata = buildMetadata({
  title: "Contato",
  description: "Fale com a equipe Bordadeiras.",
  path: "/contato",
});

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-[var(--color-brown)]">
        Contato
      </h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6 rounded-3xl bg-white p-8 dark:bg-zinc-900">
          <p className="flex items-center gap-3 text-sm">
            <Mail className="h-5 w-5 text-rose-500" />
            {siteConfig.contact.email}
          </p>
          <p className="flex items-center gap-3 text-sm">
            <Phone className="h-5 w-5 text-rose-500" />
            {siteConfig.contact.phone}
          </p>
          <p className="flex items-center gap-3 text-sm">
            <MapPin className="h-5 w-5 text-rose-500" />
            {siteConfig.contact.address}
          </p>
        </div>
        <form className="space-y-4 rounded-3xl bg-white p-8 dark:bg-zinc-900">
          <div>
            <label className="text-xs text-zinc-500">Nome</label>
            <Input name="name" required />
          </div>
          <div>
            <label className="text-xs text-zinc-500">E-mail</label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Mensagem</label>
            <textarea
              name="message"
              rows={5}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/60"
              required
            />
          </div>
          <Button type="submit">Enviar mensagem</Button>
          <p className="text-xs text-zinc-500">
            Formulário stub — integrar com API de e-mail (nodemailer) pelo agente de integrações.
          </p>
        </form>
      </div>
    </div>
  );
}
