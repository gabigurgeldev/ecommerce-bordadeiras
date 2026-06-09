import { redirect } from "next/navigation";

export default function CheckoutPaymentRedirect() {
  redirect("/checkout");
}
