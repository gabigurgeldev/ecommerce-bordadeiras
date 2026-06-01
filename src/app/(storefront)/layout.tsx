import { GsapScrollProvider } from "@/components/animations/gsap-scroll";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { organizationJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLdScript data={organizationJsonLd()} />
      <GsapScrollProvider />
      <div className="flex min-h-full flex-col">
        <div className="gradient-mesh flex-1">
          <Header />
          <main className="flex-1">{children}</main>
        </div>
        <Footer />
      </div>
    </>
  );
}
