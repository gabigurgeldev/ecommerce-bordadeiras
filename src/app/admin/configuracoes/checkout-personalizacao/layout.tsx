/**
 * Full-screen layout for the checkout theme editor.
 * Uses negative margins to cancel the parent AdminShell padding
 * and remove the max-w-7xl constraint from AdminPageContainer.
 */
export default function CheckoutPersonalizacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-m-4 w-[calc(100%+2rem)] md:-m-6 md:w-[calc(100%+3rem)] lg:-m-8 lg:w-[calc(100%+4rem)]">
      {children}
    </div>
  );
}
