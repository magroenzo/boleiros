import { useSignedUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function SignedImage({
  path,
  alt,
  className,
}: {
  path?: string | null;
  alt: string;
  className?: string;
}) {
  const { data: url } = useSignedUrl(path);
  if (!url) return <div className={cn("bg-muted", className)} aria-hidden />;
  return <img src={url} alt={alt} loading="lazy" className={className} />;
}

export function PlayerAvatar({
  path,
  name,
  className,
}: {
  path?: string | null;
  name: string;
  className?: string;
}) {
  const { data: url } = useSignedUrl(path);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-secondary-foreground",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={name} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}