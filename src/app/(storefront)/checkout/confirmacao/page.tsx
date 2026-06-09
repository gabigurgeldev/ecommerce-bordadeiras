import { redirect } from "next/navigation";

export default function CheckoutConfirmationRedirect() {
  redirect("/checkout");
}
