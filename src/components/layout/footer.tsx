import { siteConfig } from "@/lib/site";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <p className="text-lg font-semibold text-zinc-900 dark:text-white">
            {siteConfig.name}
          </p>
          <p className="mt-3 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            {siteConfig.description}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Loja</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li><Link href="/loja" className="hover:text-rose-600">Todos os produtos</Link></li>
            <li><Link href="/loja/categoria/maquinas" className="hover:text-rose-600">Máquinas</Link></li>
            <li><Link href="/loja/categoria/linhas" className="hover:text-rose-600">Linhas</Link></li>
            <li><Link href="/blog" className="hover:text-rose-600">Blog</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">Contato</p>
          <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              {siteConfig.contact.email}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              {siteConfig.contact.phone}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {siteConfig.contact.address}
            </li>
            <li>
              <a
                href={siteConfig.social.instagram}
                className="inline-flex items-center gap-2 hover:text-rose-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
        © {new Date().getFullYear()} {siteConfig.legalName}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
