import { fetchUserAddresses } from "@/actions/account/addresses";
import { getPublicCheckoutTheme } from "@/actions/admin/checkout-theme";
import { CheckoutPage } from "@/components/checkout/checkout-page";
import { getSessionUser } from "@/lib/auth/session";
import { getCheckoutPaymentConfig } from "@/lib/mercadopago-config";
import { buildMetadata } from "@/lib/seo/metadata";
import { getDb, TABLES } from "@/lib/supabase/db";

export const metadata = buildMetadata({
  title: "Checkout",
  path: "/checkout",
  noIndex: true,
});

export default async function CheckoutRoutePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const [addresses, paymentConfig, checkoutTheme] = await Promise.all([
    fetchUserAddresses(),
    getCheckoutPaymentConfig(),
    getPublicCheckoutTheme(),
  ]);

  const db = getDb();
  const { data: userRow } = await db
    .from(TABLES.User)
    .select("name, phone")
    .eq("id", sessionUser.id)
    .maybeSingle();

  return (
    <CheckoutPage
      userName={
        (userRow?.name as string | null) ??
        sessionUser.name ??
        sessionUser.email.split("@")[0]
      }
      userEmail={sessionUser.email}
      userPhone={(userRow?.phone as string | null) ?? ""}
      addresses={addresses}
      publicKey={paymentConfig.publicKey}
      enabledMethods={paymentConfig.enabledMethods}
      maxInstallments={paymentConfig.maxInstallments}
      installmentFees={paymentConfig.installmentFees}
      sandbox={paymentConfig.sandbox}
      credentialError={paymentConfig.credentialError}
      display={paymentConfig.display}
      checkoutTheme={checkoutTheme}
    />
  );
}
