import { BlogNav } from "@/components/admin/blog/blog-nav";

export default function AdminBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <BlogNav />
      {children}
    </div>
  );
}
