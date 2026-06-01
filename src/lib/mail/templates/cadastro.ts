import { button, emailLayout } from "./layout";

export function cadastroTemplate(params: { name: string; loginUrl: string }): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">Bem-vindo(a), ${params.name}!</h1>
    <p>Sua conta na Bordadeiras foi criada com sucesso.</p>
    ${button(params.loginUrl, "Acessar minha conta")}
  `;
  return emailLayout("Cadastro confirmado", body);
}
