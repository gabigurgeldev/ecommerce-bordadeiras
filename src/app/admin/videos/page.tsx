import { listVideos } from "@/actions/admin/videos";
import { PageHeader } from "@/components/admin/page-header";
import { VideoFormDialog } from "@/components/admin/video-form-dialog";
import { VideosTable } from "@/components/admin/videos-table";
import type { StorefrontVideo } from "@/lib/types/database";

export default async function AdminVideosPage() {
  const rows = await listVideos();
  const videos = rows as StorefrontVideo[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vídeos"
        description="Galeria da página /videos — links do YouTube, Vimeo ou embeds"
        actions={<VideoFormDialog />}
      />
      <VideosTable videos={videos} />
    </div>
  );
}
