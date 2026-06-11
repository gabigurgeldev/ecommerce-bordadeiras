"use client";

import { createOrderDraft, validateCheckoutCoupon } from "@/actions/checkout";
import {
  CheckoutAddressSection,
  type AddressReadyData,
} from "@/components/checkout/checkout-address-section";
import { CheckoutFooterLinks } from "@/components/checkout/checkout-footer-links";
import {
  CheckoutPersonalInfoSection,
  cpfDigits,
  type PersonalInfo,
} from "@/components/checkout/checkout-personal-info-section";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";
import { CheckoutPaymentPanel } from "@/components/checkout/checkout-payment-panel";
import { CheckoutPaymentMethodSelector } from "@/components/checkout/checkout-payment-method-selector";
import { CheckoutSandboxBanner } from "@/components/checkout/checkout-sandbox-banner";
import { CheckoutSandboxPayerEmail } from "@/components/checkout/checkout-sandbox-payer-email";
import { isMpTestUserEmail } from "@/lib/mercadopago-errors";
import { CheckoutStepNav } from "@/components/checkout/checkout-step-nav";
import { CheckoutStepSummary } from "@/components/checkout/checkout-step-summary";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";
import type { CheckoutStep } from "@/components/checkout/checkout-stepper";
import { CheckoutThemeProvider } from "@/components/checkout/checkout-theme-provider";
import { CheckoutTrustStrip } from "@/components/checkout/checkout-trust-strip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildAvailableMethods,
  type CheckoutPaymentMethodId,
} from "@/lib/checkout-payment-methods";
import type { CheckoutTheme } from "@/lib/checkout-theme";
import { isValidCpf, maskCpf } from "@/lib/cpf";
import type { PendingCheckoutResume } from "@/lib/data/pending-order";
import type { CheckoutDisplayConfig, MercadoPagoEnabledMethods } from "@/lib/mercadopago-config";
import { recordActivityClient } from "@/lib/tracking/record-activity-client";
import type { Address } from "@/lib/types/database";
import { CustomerActivityType } from "@/lib/types/database";
import { useCartStore } from "@/store/cart";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type WizardStep = "endereco" | "dados" | "pagamento";

type AddressReady = AddressReadyData;

export function CheckoutPage({
  userName,
  userEmail,
  userPhone,
  addresses,
  publicKey,
  enabledMethods,
  maxInstallments,
  installmentFees,
  sandbox,
  credentialError,
  display,
  checkoutTheme,
  initialResume = null,
}: {
  userName: string;
  userEmail: string;
  userPhone: string;
  addresses: Address[];
  publicKey: string | null;
  enabledMethods: MercadoPagoEnabledMethods;
  maxInstallments: number;
  installmentFees: "merchant" | "buyer";
  sandbox: boolean;
  credentialError: string | null;
  display: CheckoutDisplayConfig;
  checkoutTheme?: CheckoutTheme;
  initialResume?: PendingCheckoutResume | null;
}) {
  const router = useRouter();
  const { lines, couponCode, applyCoupon, subtotalCents, hasHydrated, clearCart } =
    useCartStore();

  const [wizardStep, setWizardStep] = useState<WizardStep>("endereco");
  const [addressData, setAddressData] = useState<AddressReady | null>(null);
  const [shippingPreview, setShippingPreview] = useState({
    shippingCents: 0,
    calculated: false,
  });
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [personalInfoValid, setPersonalInfoValid] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [totalCents, setTotalCents] = useState(0);
  const [discountCents, setDiscountCents] = useState(0);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [selectedMethod, setSelectedMethod] =
    useState<CheckoutPaymentMethodId | null>(null);
  const [confirmedMethod, setConfirmedMethod] =
    useState<CheckoutPaymentMethodId | null>(null);
  const [sandboxPayerEmail, setSandboxPayerEmail] = useState("");
  const [sandboxEmailReady, setSandboxEmailReady] = useState(false);
  const [resumeLines, setResumeLines] = useState<
    PendingCheckoutResume["items"] | null
  >(null);
  const [resumeSubtotalCents, setResumeSubtotalCents] = useState(0);

  const trustMessages = checkoutTheme?.cta?.trustMessages ?? [];
  const [trustMsgIdx, setTrustMsgIdx] = useState(0);
  const trustMsgIdxRef = useRef(trustMsgIdx);
  trustMsgIdxRef.current = trustMsgIdx;
  const resumeAppliedRef = useRef(false);
  const checkoutTrackedRef = useRef(false);

  useEffect(() => {
    if (checkoutTrackedRef.current) return;
    checkoutTrackedRef.current = true;
    recordActivityClient({
      type: CustomerActivityType.BEGIN_CHECKOUT,
      path: "/checkout",
    });
  }, []);

  useEffect(() => {
    if (!hasHydrated || resumeAppliedRef.current || !initialResume) return;
    if (lines.length > 0) return;

    resumeAppliedRef.current = true;
    setOrderId(initialResume.orderId);
    setTotalCents(initialResume.totalCents);
    setDiscountCents(initialResume.discountCents);
    setResumeLines(initialResume.items);
    setResumeSubtotalCents(initialResume.subtotalCents);
    setAddressData({
      shippingAddress: initialResume.shippingAddress,
      shippingAddressId: initialResume.shippingAddressId ?? undefined,
      shippingCents: initialResume.shippingCents,
      estimatedDays: "",
      shippingServiceName: initialResume.shippingServiceName ?? undefined,
    });
    setPersonalInfo({
      name: initialResume.customerName,
      email: initialResume.customerEmail,
      phone: initialResume.customerPhone ?? userPhone ?? "",
      cpf: "",
    });
    setPersonalInfoValid(false);
    setShippingPreview({
      shippingCents: initialResume.shippingCents,
      calculated: true,
    });
    if (initialResume.couponCode) {
      applyCoupon(initialResume.couponCode);
    }
    setWizardStep("pagamento");
  }, [hasHydrated, initialResume, lines.length, userPhone, applyCoupon]);

  useEffect(() => {
    if (trustMessages.length < 2) return;
    const id = setInterval(
      () => setTrustMsgIdx((i) => (i + 1) % trustMessages.length),
      4000,
    );
    return () => clearInterval(id);
  }, [trustMessages.length]);

  useEffect(() => {
    async function calcDiscount() {
      if (!couponCode) {
        setDiscountCents(0);
        return;
      }
      const result = await validateCheckoutCoupon(couponCode, subtotalCents());
      setDiscountCents(result.ok ? result.coupon.discountCents : 0);
    }
    void calcDiscount();
  }, [couponCode, lines, subtotalCents]);

  const handleAddressReady = useCallback((data: AddressReady) => {
    setAddressData(data);
    setShippingPreview({
      shippingCents: data.shippingCents,
      calculated: true,
    });
  }, []);

  const handleAddressEdit = useCallback(() => {
    setAddressData(null);
  }, []);

  const handleShippingChange = useCallback(
    (data: {
      shippingCents: number;
      calculated: boolean;
    }) => {
      setShippingPreview({
        shippingCents: data.shippingCents,
        calculated: data.calculated,
      });
    },
    [],
  );

  const handlePersonalInfoChange = useCallback(
    (info: PersonalInfo, valid: boolean) => {
      setPersonalInfo(info);
      setPersonalInfoValid(valid);
    },
    [],
  );

  const cpfReady =
    personalInfo != null && isValidCpf(cpfDigits(personalInfo.cpf));

  const handleSelectPaymentMethod = useCallback(
    (method: CheckoutPaymentMethodId) => {
      if (personalInfo && !isValidCpf(cpfDigits(personalInfo.cpf))) {
        toast.error("Informe um CPF válido para continuar");
        return;
      }
      setSelectedMethod(method);
      setConfirmedMethod(method);
      setSandboxEmailReady(false);
    },
    [personalInfo],
  );

  function handleResumeCpfChange(value: string) {
    if (!personalInfo) return;
    const masked = maskCpf(value);
    const next = { ...personalInfo, cpf: masked };
    setPersonalInfo(next);
    setPersonalInfoValid(isValidCpf(cpfDigits(masked)));
  }

  function handleChangePaymentMethod() {
    setSelectedMethod(null);
    setConfirmedMethod(null);
    setSandboxEmailReady(false);
  }

  useEffect(() => {
    if (
      sandbox &&
      personalInfo?.email &&
      isMpTestUserEmail(personalInfo.email)
    ) {
      setSandboxPayerEmail(personalInfo.email.trim().toLowerCase());
      setSandboxEmailReady(false);
    }
  }, [sandbox, personalInfo?.email, confirmedMethod]);

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const result = await validateCheckoutCoupon(code, subtotalCents());
      if (!result.ok) {
        setCouponError(result.error);
        return;
      }
      applyCoupon(code);
      setDiscountCents(result.coupon.discountCents);
      setCouponInput("");
      toast.success("Cupom aplicado com sucesso!");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    applyCoupon(null);
    setDiscountCents(0);
    setCouponInput("");
    setCouponError(null);
    toast.info("Cupom removido");
  }

  async function handleAdvanceToPayment() {
    if (!personalInfoValid || !personalInfo || !addressData) {
      toast.error("Preencha suas informações pessoais, incluindo CPF válido");
      return;
    }

    if (orderId && totalCents > 0) {
      setSelectedMethod(null);
      setConfirmedMethod(null);
      setWizardStep("pagamento");
      return;
    }

    setCreatingOrder(true);
    try {
      const result = await createOrderDraft({
        customerEmail: personalInfo.email,
        customerName: personalInfo.name.trim(),
        customerPhone: personalInfo.phone || userPhone || undefined,
        shippingAddress: addressData.shippingAddress,
        shippingAddressId: addressData.shippingAddressId,
        shippingCents: addressData.shippingCents,
        shippingMethod: addressData.shippingMethod,
        couponCode: couponCode ?? undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: l.quantity,
        })),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setOrderId(result.orderId);
      setTotalCents(result.totalCents);
      if (result.shippingCents !== addressData.shippingCents) {
        setAddressData({ ...addressData, shippingCents: result.shippingCents });
        setShippingPreview({
          shippingCents: result.shippingCents,
          calculated: true,
        });
      }
      setResumeLines(null);
      setResumeSubtotalCents(0);
      setSelectedMethod(null);
      setConfirmedMethod(null);
      setWizardStep("pagamento");
      clearCart();
      toast.success(
        result.reused
          ? "Continuando seu pedido pendente. Escolha a forma de pagamento."
          : "Pedido criado. Escolha a forma de pagamento.",
      );
    } finally {
      setCreatingOrder(false);
    }
  }

  const handlePaymentComplete = useCallback(
    (result: { status: string; paymentId: string | number }) => {
      const order = orderId ?? "";
      if (result.status === "approved") {
        router.push(`/checkout/success?order=${order}`);
      } else if (result.status === "pending" || result.status === "in_process") {
        router.push(`/checkout/pending?order=${order}&payment=${result.paymentId}`);
      } else {
        router.push(`/checkout/failure?order=${order}`);
      }
    },
    [orderId, router],
  );

  const shippingCents =
    addressData?.shippingCents ?? shippingPreview.shippingCents;
  const shippingCalculated =
    addressData != null || shippingPreview.calculated;
  const paymentOptions = buildAvailableMethods(
    enabledMethods,
    maxInstallments,
    installmentFees,
  );
  const selectedMethodLabel =
    paymentOptions.find((o) => o.id === selectedMethod)?.label ?? "pagamento";

  const currentStep: CheckoutStep =
    wizardStep === "pagamento"
      ? "pagamento"
      : wizardStep === "dados"
        ? "dados"
        : "endereco";

  const showStepper = checkoutTheme?.stepper?.showStepper !== false;
  const logoUrl = checkoutTheme?.branding?.logoUrl?.trim() ?? "";

  const cardStyle: React.CSSProperties | undefined = checkoutTheme
    ? {
        backgroundColor: "var(--co-bg)",
        borderColor: "var(--co-border)",
        borderRadius: "var(--co-radius)",
        boxShadow: "var(--co-shadow)",
      }
    : undefined;
  const btnStyle: React.CSSProperties | undefined = checkoutTheme
    ? {
        backgroundColor: "var(--co-btn-bg)",
        color: "var(--co-btn-text)",
        borderColor: "var(--co-btn-bg)",
        borderRadius: "var(--co-radius)",
      }
    : undefined;
  const headingStyle: React.CSSProperties | undefined = checkoutTheme
    ? { fontFamily: "var(--co-font-heading)" }
    : undefined;
  const mutedStyle: React.CSSProperties | undefined = checkoutTheme
    ? { color: "var(--co-text)", opacity: 0.7 }
    : undefined;
  const rootFontStyle: React.CSSProperties | undefined = checkoutTheme
    ? {
        fontFamily: "var(--co-font-body)",
        fontSize: "var(--co-font-size)",
        color: "var(--co-text)",
      }
    : undefined;

  const couponProps = {
    couponCode,
    couponInput,
    couponError,
    couponLoading,
    onCouponInputChange: (value: string) => {
      setCouponInput(value);
      if (couponError) setCouponError(null);
    },
    onApplyCoupon: () => void handleApplyCoupon(),
    onRemoveCoupon: handleRemoveCoupon,
  };

  const summaryProps = {
    shippingCents,
    shippingCalculated,
    shippingLabel: addressData?.shippingServiceName,
    discountCents,
    resumeLines: resumeLines ?? undefined,
    resumeSubtotalCents: resumeLines ? resumeSubtotalCents : undefined,
    resumeTotalCents: resumeLines ? totalCents : undefined,
  };

  const showEmptyCheckout =
    hasHydrated && lines.length === 0 && !orderId && !initialResume;

  const stepContent = showEmptyCheckout ? (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200">
        Nenhum pedido em andamento
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        Adicione produtos à sacola para iniciar uma compra.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/loja">Ir para a loja</Link>
      </Button>
    </div>
  ) : (
    <>
      {wizardStep === "endereco" && (
        <>
          <CheckoutAddressSection
            addresses={addresses}
            defaultName={userName}
            defaultPhone={userPhone}
            onAddressReady={handleAddressReady}
            onShippingChange={handleShippingChange}
            onEdit={handleAddressEdit}
            initialConfirmed={!!addressData}
            savedAddressId={addressData?.shippingAddressId}
            savedShippingCents={addressData?.shippingCents}
            savedShippingMethod={addressData?.shippingMethod}
            cardStyle={cardStyle}
            headingStyle={headingStyle}
          />
          <CheckoutStepNav
            showBack={false}
            continueLabel="Continuar"
            continueDisabled={!addressData}
            onContinue={() => setWizardStep("dados")}
            btnStyle={btnStyle}
          />
        </>
      )}

      {wizardStep === "dados" && (
        <>
          <CheckoutStepSummary
            address={addressData?.shippingAddress}
            onEditAddress={() => setWizardStep("endereco")}
            cardStyle={cardStyle}
          />
          <CheckoutPersonalInfoSection
            defaultName={userName}
            defaultEmail={userEmail}
            defaultPhone={userPhone}
            value={personalInfo}
            onInfoChange={handlePersonalInfoChange}
            cardStyle={cardStyle}
            headingStyle={headingStyle}
          />
          <CheckoutStepNav
            continueLabel="Continuar para pagamento"
            continueDisabled={!personalInfoValid}
            continueLoading={creatingOrder}
            onBack={() => setWizardStep("endereco")}
            onContinue={() => void handleAdvanceToPayment()}
            btnStyle={btnStyle}
          />
        </>
      )}

      {wizardStep === "pagamento" && orderId && totalCents > 0 && (
        <>
          <CheckoutStepSummary
            address={addressData?.shippingAddress}
            personalInfo={personalInfo}
            onEditAddress={() => {
              setSelectedMethod(null);
              setConfirmedMethod(null);
              setWizardStep("endereco");
            }}
            onEditPersonal={() => {
              setSelectedMethod(null);
              setConfirmedMethod(null);
              setWizardStep("dados");
            }}
            cardStyle={cardStyle}
          />

          <section
            className="rounded-2xl border bg-white p-6 dark:bg-zinc-900"
            style={cardStyle}
          >
            <h2 className="mb-4 text-lg font-semibold" style={headingStyle}>
              Pagamento
            </h2>

            {sandbox && !credentialError && <CheckoutSandboxBanner />}

            {personalInfo && !cpfReady && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <Label htmlFor="checkout-resume-cpf" className="text-sm font-medium">
                  CPF para pagamento
                </Label>
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                  Informe seu CPF para continuar com o pagamento do pedido.
                </p>
                <Input
                  id="checkout-resume-cpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={personalInfo.cpf}
                  onChange={(e) => handleResumeCpfChange(e.target.value)}
                  className="mt-3 max-w-xs"
                />
              </div>
            )}

            {credentialError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                <p className="font-medium">Pagamentos indisponíveis</p>
                <p className="mt-1">{credentialError}</p>
                {sandbox && (
                  <p className="mt-2 text-xs opacity-90">
                    Admin → Configurações → Mercado Pago: ative sandbox, cole Public Key e
                    Access Token de Testes → Credenciais de teste e salve os dois juntos.
                  </p>
                )}
              </div>
            )}

              {!confirmedMethod ? (
                <>
                  <p className="mb-3 text-sm text-zinc-600" style={mutedStyle}>
                    Escolha como deseja pagar
                  </p>
                  {cpfReady ? (
                    <CheckoutPaymentMethodSelector
                      enabledMethods={enabledMethods}
                      maxInstallments={maxInstallments}
                      installmentFees={installmentFees}
                      selectedMethod={selectedMethod}
                      onSelect={handleSelectPaymentMethod}
                    />
                  ) : (
                    <p className="text-sm text-zinc-500">
                      Preencha o CPF acima para escolher a forma de pagamento.
                    </p>
                  )}
                </>
              ) : (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Forma de pagamento
                    </p>
                    <p className="text-sm font-semibold" style={headingStyle}>
                      {selectedMethodLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangePaymentMethod}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Trocar
                  </button>
                </div>
              )}

              {confirmedMethod && personalInfo && !credentialError && (
                <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                  {sandbox && !sandboxEmailReady && (
                    <CheckoutSandboxPayerEmail
                      value={sandboxPayerEmail}
                      onChange={setSandboxPayerEmail}
                      onConfirm={() => setSandboxEmailReady(true)}
                    />
                  )}

                  {sandbox && sandboxEmailReady && (
                    <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        E-mail de teste:{" "}
                        <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                          {sandboxPayerEmail}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSandboxEmailReady(false)}
                        className="shrink-0 font-medium text-rose-600 hover:underline"
                      >
                        Alterar
                      </button>
                    </div>
                  )}

                  {(!sandbox || sandboxEmailReady) && (
                    <CheckoutPaymentPanel
                      key={`${orderId}-${confirmedMethod}-${sandbox ? sandboxPayerEmail : personalInfo.email}`}
                      publicKey={publicKey}
                      amountCents={totalCents}
                      orderId={orderId}
                      payerEmail={
                        sandbox ? sandboxPayerEmail : personalInfo.email
                      }
                      payerName={personalInfo.name}
                      payerCpf={cpfDigits(personalInfo.cpf)}
                      selectedMethod={confirmedMethod}
                      maxInstallments={maxInstallments}
                      installmentFees={installmentFees}
                      sandbox={sandbox}
                      onPaymentComplete={handlePaymentComplete}
                    />
                  )}
                </div>
              )}
          </section>

          <CheckoutStepNav
            showBack
            showContinue={false}
            onBack={() => {
              setSelectedMethod(null);
              setConfirmedMethod(null);
              setWizardStep("dados");
            }}
            btnStyle={btnStyle}
          />
        </>
      )}
    </>
  );

  const inner = showEmptyCheckout ? (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6" style={rootFontStyle}>
      {stepContent}
      <CheckoutFooterLinks theme={checkoutTheme} />
    </div>
  ) : (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12" style={rootFontStyle}>
      {showStepper && <CheckoutStepper currentStep={currentStep} />}

      <header
        className="mb-6 flex items-center gap-4 border-b pb-4"
        style={{ borderColor: checkoutTheme ? "var(--co-border)" : undefined }}
      >
        {logoUrl && (
          <Image
            src={logoUrl}
            alt="Logo"
            width={120}
            height={40}
            className="h-10 w-auto object-contain"
            unoptimized
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl" style={headingStyle}>
            {display.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500" style={mutedStyle}>
            {display.subtitle}
          </p>
        </div>
      </header>

      {checkoutTheme?.cta?.urgencyText && (
        <div
          className="mb-6 rounded-xl px-4 py-2.5 text-center text-sm font-medium text-white"
          style={{
            backgroundColor: "var(--co-accent)",
            borderRadius: "var(--co-radius)",
          }}
        >
          {checkoutTheme.cta.urgencyText}
        </div>
      )}

      <CheckoutOrderSummary
        {...summaryProps}
        collapsible
        cardStyle={cardStyle}
        headingStyle={headingStyle}
        coupon={resumeLines ? undefined : couponProps}
      />

      {trustMessages.length > 0 && (
        <p
          className="mt-3 text-center text-xs italic lg:hidden"
          style={mutedStyle}
          key={trustMsgIdx}
        >
          {trustMessages[trustMsgIdx]}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {stepContent}
          <CheckoutTrustStrip theme={checkoutTheme} />
        </div>

        <div className="hidden lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-4">
            <CheckoutOrderSummary
              {...summaryProps}
              cardStyle={cardStyle}
              headingStyle={headingStyle}
              coupon={resumeLines ? undefined : couponProps}
            />
            {trustMessages.length > 0 && (
              <p
                className="text-center text-xs italic"
                style={mutedStyle}
                key={trustMsgIdx}
              >
                {trustMessages[trustMsgIdx]}
              </p>
            )}
          </div>
        </div>
      </div>

      <CheckoutFooterLinks theme={checkoutTheme} />
    </div>
  );

  if (!checkoutTheme) return inner;

  return (
    <CheckoutThemeProvider theme={checkoutTheme}>
      {inner}
    </CheckoutThemeProvider>
  );
}
