export function EmailSpamNotice({ className }: { className?: string }) {
  return (
    <p className={className ?? "text-xs text-[var(--muted-foreground)]"}>
      Não encontrou o e-mail? Verifique também a caixa de{" "}
      <strong className="font-semibold text-[var(--foreground)]/80">SPAM</strong>,{" "}
      <strong className="font-semibold text-[var(--foreground)]/80">Lixo eletrônico</strong> e{" "}
      <strong className="font-semibold text-[var(--foreground)]/80">Promoções</strong>.
    </p>
  );
}
