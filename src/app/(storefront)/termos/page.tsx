import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Termos de uso",
  description: `Termos de uso da loja ${siteConfig.name}.`,
  path: "/termos",
});

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-[var(--color-brown)]">
        Termos de uso
      </h1>
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">
        Última atualização: {new Date().getFullYear()}
      </p>

      <div className="prose prose-sm mt-10 max-w-none text-[var(--color-brown-muted)] prose-headings:text-[var(--color-brown)]">
        <h2>1. Aceitação</h2>
        <p>
          Ao utilizar o site {siteConfig.name}, você concorda com estes termos. Se não
          concordar, não utilize nossos serviços.
        </p>

        <h2>2. Produtos e preços</h2>
        <p>
          Os preços, disponibilidade e descrições dos produtos podem ser alterados sem
          aviso prévio. Imagens são ilustrativas e podem apresentar variações de cor ou
          acabamento.
        </p>

        <h2>3. Pedidos e pagamento</h2>
        <p>
          O pedido é confirmado após aprovação do pagamento. Reservamo-nos o direito de
          cancelar pedidos em caso de inconsistências, suspeita de fraude ou indisponibilidade
          de estoque.
        </p>

        <h2>4. Entrega</h2>
        <p>
          Prazos de entrega são estimativas fornecidas pelas transportadoras no momento da
          compra e podem variar conforme região, disponibilidade logística e feriados.
        </p>

        <h2>5. Trocas e devoluções</h2>
        <p>
          As condições de troca e devolução seguem o Código de Defesa do Consumidor e as
          políticas informadas no site ou no atendimento.
        </p>

        <h2>6. Contato</h2>
        <p>
          Dúvidas sobre estes termos:{" "}
          <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
        </p>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/contato" className="text-[var(--color-cta)] underline-offset-2 hover:underline">
          Fale conosco
        </Link>
      </p>
    </div>
  );
}
