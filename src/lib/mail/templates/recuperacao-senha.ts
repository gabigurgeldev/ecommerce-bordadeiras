import { button, emailLayout } from "./layout";

export function recuperacaoSenhaTemplate(params: {
  name: string;
  resetUrl: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">Recuperação de senha</h1>
    <p>Olá, ${params.name}. Recebemos uma solicitação para redefinir sua senha.</p>
    <p>O link expira em 1 hora.</p>
    ${button(params.resetUrl, "Redefinir senha")}
    <p style="color:#71717a;font-size:13px;">Se você não solicitou, ignore este e-mail.</p>
  `;
  return emailLayout("Recuperação de senha", body);
}
