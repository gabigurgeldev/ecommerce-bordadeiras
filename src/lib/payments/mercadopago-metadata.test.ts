import { describe, expect, it } from "vitest";
import { sanitizeMercadoPagoPaymentMetadata } from "@/lib/payments/mercadopago-metadata";

describe("sanitizeMercadoPagoPaymentMetadata", () => {
  it("keeps only reconciliation fields from Mercado Pago payments", () => {
    const metadata = sanitizeMercadoPagoPaymentMetadata({
      id: 123,
      status: "approved",
      status_detail: "accredited",
      external_reference: "order-1",
      transaction_amount: 199.9,
      currency_id: "BRL",
      payment_method_id: "pix",
      payment_type_id: "bank_transfer",
      payer: { email: "cliente@example.com", identification: { number: "123" } },
      card: { first_six_digits: "411111", last_four_digits: "1111" },
      point_of_interaction: {
        transaction_data: {
          qr_code: "raw-qr-code",
          qr_code_base64: "raw-qr-code-base64",
        },
      },
      transaction_details: {
        net_received_amount: 190,
        total_paid_amount: 199.9,
        external_resource_url: "https://boleto.example",
      },
    });

    expect(metadata).toEqual({
      provider: "mercadopago",
      id: 123,
      status: "approved",
      status_detail: "accredited",
      external_reference: "order-1",
      transaction_amount: 199.9,
      currency_id: "BRL",
      payment_method_id: "pix",
      payment_type_id: "bank_transfer",
      transaction_details: {
        net_received_amount: 190,
        total_paid_amount: 199.9,
      },
    });
  });

  it("returns provider metadata for invalid payloads", () => {
    expect(sanitizeMercadoPagoPaymentMetadata(null)).toEqual({
      provider: "mercadopago",
    });
  });
});
