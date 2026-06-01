import { ScrollReveal } from "@/components/animations/scroll-reveal";
import { GlassCard } from "@/components/ui/glass-card";
import { Headphones, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Entrega nacional",
    description: "Envio seguro para todo o Brasil com rastreamento.",
  },
  {
    icon: ShieldCheck,
    title: "Garantia oficial",
    description: "Produtos com suporte e assistência técnica especializada.",
  },
  {
    icon: Headphones,
    title: "Atendimento humano",
    description: "Equipe pronta via WhatsApp, e-mail e telefone.",
  },
];

export function Benefits() {
  return (
    <section className="py-20" data-gsap-fade>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {benefits.map((b, i) => (
            <ScrollReveal key={b.title} delay={i * 0.1}>
              <GlassCard className="h-full">
                <b.icon className="h-8 w-8 text-rose-500" />
                <h3 className="mt-4 font-semibold text-zinc-900 dark:text-white">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {b.description}
                </p>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
