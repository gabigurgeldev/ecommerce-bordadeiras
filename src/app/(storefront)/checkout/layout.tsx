import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?callbackUrl=%2Fcheckout");
  }
  return <>{children}</>;
}
