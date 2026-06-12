import { getAvatarColor, getAuthorAvatarUrl, getAuthorName, getInitials } from "@/lib/blog/public-utils";
import type { PublicBlogPost } from "@/lib/blog/public-utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Props = {
  post: PublicBlogPost;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function BlogAuthorAvatar({ post, size = "md", className }: Props) {
  const name = getAuthorName(post);
  const avatarUrl = getAuthorAvatarUrl(post);

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size === "lg" ? 48 : size === "md" ? 40 : 32}
        height={size === "lg" ? 48 : size === "md" ? 40 : 32}
        className={cn("shrink-0 rounded-full object-cover", sizeMap[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        getAvatarColor(name),
        sizeMap[size],
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}
