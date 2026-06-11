import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Política de privacidade",
  description: `Política de privacidade da ${siteConfig.name}.`,
  path: "/privacidade",
});

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-[var(--color-brown)]">
        Política de privacidade
      </h1>
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">
        Última atualização: {new Date().getFullYear()}
      </p>

      <div className="prose prose-sm mt-10 max-w-none text-[var(--color-brown-muted)] prose-headings:text-[var(--color-brown)]">
        <h2>1. Dados que coletamos</h2>
        <p>
          Coletamos informações necessárias para processar pedidos, como nome, e-mail,
          telefone, CPF (quando exigido pelo meio de pagamento), endereço de entrega e
          histórico de compras.
        </p>

        <h2>2. Uso dos dados</h2>
        <p>
          Utilizamos seus dados para finalizar compras, calcular frete, emitir notificações
          sobre pedidos, prestar suporte e cumprir obrigações legais.
        </p>

        <h2>3. Compartilhamento</h2>
        <p>
          Podemos compartilhar dados com parceiros essenciais à operação, como
          processadores de pagamento, transportadoras e provedores de infraestrutura,
          sempre no limite necessário para a prestação do serviço.
        </p>

        <h2>4. Segurança e retenção</h2>
        <p>
          Adotamos medidas técnicas e organizacionais para proteger suas informações.
          Mantemos os dados pelo tempo necessário para cumprir finalidades contratuais e
          legais.
        </p>

        <h2>5. Seus direitos</h2>
        <p>
          Você pode solicitar acesso, correção ou exclusão de dados pessoais entrando em
          contato conosco pelos canais abaixo.
        </p>

        <h2>6. Contato</h2>
        <p>
          E-mail:{" "}
          <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
          <br />
          Telefone: {siteConfig.contact.phone}
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
