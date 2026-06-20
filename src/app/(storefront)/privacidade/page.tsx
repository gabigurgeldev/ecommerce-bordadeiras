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
          Coletamos dados informados por você e necessários para operar a loja:
          nome, e-mail, telefone, endereço de entrega, dados de cadastro, itens da
          sacola, pedidos, histórico de compras, mensagens de suporte e preferências
          de contato. Quando exigido pelo pagamento ou por obrigação fiscal, também
          podemos tratar CPF e dados relacionados à transação.
        </p>
        <p>
          Se você autorizar analytics comportamental, registramos eventos de navegação
          autenticada, como páginas visitadas, buscas, produtos visualizados, adição à
          sacola e início de checkout. Esses dados são usados para métricas internas,
          personalização e oportunidades como recuperação de sacola.
        </p>

        <h2>2. Bases e finalidades de uso</h2>
        <p>
          Usamos dados para executar compras, calcular frete, processar pagamentos,
          emitir comunicações transacionais, prestar suporte, prevenir fraude, cumprir
          obrigações legais e manter a segurança da plataforma.
        </p>
        <p>
          Comunicações promocionais, recuperação de sacola por WhatsApp, analytics
          comportamental e personalização com IA dependem de consentimento ou
          preferência específica, que pode ser alterada na área da conta.
        </p>

        <h2>3. Operadores e compartilhamento</h2>
        <p>
          Compartilhamos dados somente no limite necessário com operadores essenciais:
          Supabase para banco de dados, autenticação e infraestrutura; Mercado Pago
          para processamento de pagamentos; serviços de WhatsApp para envio de
          mensagens autorizadas; provedores de e-mail, frete, hospedagem e ferramentas
          administrativas.
        </p>
        <p>
          Para funções de IA, podemos enviar contexto minimizado a provedores como
          OpenRouter. Por padrão, esse contexto não inclui e-mail, telefone, CPF,
          endereço, atividade bruta ou identificadores completos, e só é usado quando
          houver preferência aplicável.
        </p>

        <h2>4. Pagamentos e PCI</h2>
        <p>
          Pagamentos são processados pelo Mercado Pago. A loja não deve armazenar
          número completo de cartão, CVV ou credenciais sensíveis de pagamento. Dados
          de pagamento retornados pelo processador são tratados para confirmação do
          pedido, conciliação, prevenção de fraude e obrigações legais.
        </p>

        <h2>5. Transferência internacional</h2>
        <p>
          Alguns operadores podem processar ou armazenar dados fora do Brasil. Quando
          isso ocorrer, adotamos medidas compatíveis com a LGPD, limitando dados ao
          necessário e exigindo controles de segurança e confidencialidade dos
          fornecedores.
        </p>

        <h2>6. Segurança e retenção</h2>
        <p>
          Adotamos medidas técnicas e organizacionais para proteger suas informações.
          Mantemos dados de conta, pedidos, pagamentos, auditoria e registros fiscais
          pelo tempo necessário para finalidades contratuais, legais, regulatórias e de
          defesa de direitos.
        </p>
        <p>
          Eventos de analytics e perfilamento devem ser mantidos apenas enquanto forem
          úteis para a finalidade consentida e podem ser interrompidos quando você
          revogar a preferência. Solicitações de exclusão serão avaliadas considerando
          obrigações legais de retenção.
        </p>

        <h2>7. Seus direitos LGPD</h2>
        <p>
          Você pode solicitar confirmação de tratamento, acesso, correção,
          portabilidade, anonimização, bloqueio, eliminação, informação sobre
          compartilhamentos, revisão de decisões automatizadas e revogação de
          consentimento. Também pode alterar preferências de contato e personalização
          na sua conta.
        </p>

        <h2>8. Contato</h2>
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
