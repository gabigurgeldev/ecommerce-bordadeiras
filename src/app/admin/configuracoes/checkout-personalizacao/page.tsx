import { getCheckoutThemeSettings } from "@/actions/admin/checkout-theme";
import { CheckoutThemeEditorLauncher } from "@/components/admin/checkout-theme-editor-launcher";

export const metadata = {
  title: "Personalização do Checkout | Admin",
};

export default async function CheckoutPersonalizacaoPage() {
  const theme = await getCheckoutThemeSettings();

  return <CheckoutThemeEditorLauncher initialTheme={theme} />;
}
