import Link from "next/link";
import { listBlogPosts, listBlogCategories, listBlogTags } from "@/actions/admin/blog";
import { PageHeader } from "@/components/admin/page-header";
import { BlogMetaPanel } from "@/components/admin/blog-meta-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default async function AdminBlogPage() {
  const [posts, categories, tags] = await Promise.all([
    listBlogPosts(),
    listBlogCategories(),
    listBlogTags(),
  ]);

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Posts, categorias e SEO"
        actions={
          <Button asChild>
            <Link href="/admin/blog/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo post
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.category?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(post.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/blog/${post.id}`} className="text-sm text-primary hover:underline">
                        Editar
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias e tags</CardTitle>
          </CardHeader>
          <CardContent>
            <BlogMetaPanel categories={categories} tags={tags} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
