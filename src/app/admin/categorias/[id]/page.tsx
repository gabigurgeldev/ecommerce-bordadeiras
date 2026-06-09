import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function EditCategoryRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/categorias?edit=${encodeURIComponent(id)}`);
}
