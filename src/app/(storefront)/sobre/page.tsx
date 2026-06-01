import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import Image from "next/image";

export const metadata = buildMetadata({
  title: "Sobre nós",
  description: `Conheça a história da ${siteConfig.name}.`,
  path: "/sobre",
});

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <ScrollReveal>
        <h1 className="font-display text-4xl font-semibold text-white">Sobre</h1>
        <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-2xl">
          <Image
            src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80"
            alt="Nossa história"
            fill
            className="object-cover"
            sizes="768px"
          />
        </div>
        <div className="mt-10 space-y-4 rounded-3xl bg-white p-8 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <p>
            A <strong>{siteConfig.legalName}</strong> nasceu da paixão pelo bordado
            e da necessidade de oferecer equipamentos e insumos com qualidade
            comprovada e suporte próximo ao cliente.
          </p>
          <p>
            Trabalhamos com as principais marcas do mercado, assistência técnica
            especializada e logística nacional para que seu ateliê nunca pare.
          </p>
          <p>{siteConfig.contact.address}</p>
        </div>
      </ScrollReveal>
    </div>
  );
}
