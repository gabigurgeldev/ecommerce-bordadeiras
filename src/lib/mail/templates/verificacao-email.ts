import { emailLayout } from "./layout";

export function verificacaoEmailTemplate(params: {
  name: string;
  code: string;
  verifyUrl: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">Confirme seu e-mail</h1>
    <p>Olá, ${params.name}! Use o código abaixo para verificar sua conta na Bordadeiras:</p>
    <p style="margin:24px 0;text-align:center;">
      <span style="display:inline-block;background:#f4f4f5;border-radius:8px;padding:16px 32px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#18181b;">${params.code}</span>
    </p>
    <p style="color:#71717a;font-size:14px;">Este código expira em 15 minutos.</p>
    <p style="margin-top:16px;font-size:14px;">Ou acesse a página de verificação e informe o código:</p>
    <p><a href="${params.verifyUrl}" style="color:#1e3a5f;">${params.verifyUrl}</a></p>
    <p style="margin-top:24px;color:#71717a;font-size:13px;">Se você não criou esta conta, ignore este e-mail.</p>
  `;
  return emailLayout("Verificação de e-mail", body);
}
