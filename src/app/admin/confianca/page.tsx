import { listTrustBarItems } from "@/actions/admin/trust-bar";
import { PageHeader } from "@/components/admin/page-header";
import { TrustBarFormDialog } from "@/components/admin/trust-bar-form-dialog";
import { TrustBarTable } from "@/components/admin/trust-bar-table";

export default async function AdminTrustBarPage() {
  const items = await listTrustBarItems();

  return (
    <div>
      <PageHeader
        title="Barra de confiança"
        description="Ícones e textos abaixo do banner na página inicial"
        actions={<TrustBarFormDialog />}
      />
      <TrustBarTable items={items} />
    </div>
  );
}
