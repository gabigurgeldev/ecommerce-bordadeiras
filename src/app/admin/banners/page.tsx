import { listBanners } from "@/actions/admin/banners";
import { BannerFormDialog } from "@/components/admin/banner-form-dialog";
import { BannersTable } from "@/components/admin/banners-table";
import { PageHeader } from "@/components/admin/page-header";

export default async function AdminBannersPage() {
  const banners = await listBanners();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners da home"
        description="Carrossel de imagens na página inicial — sem texto sobre o banner"
        actions={<BannerFormDialog />}
      />
      <BannersTable banners={banners} />
    </div>
  );
}
