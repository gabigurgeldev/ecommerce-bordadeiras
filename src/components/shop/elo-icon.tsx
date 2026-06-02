import type { SVGProps } from "react";

/** Marca Elo (não disponível em react-icons/si) */
export function IconElo({
  className,
  style,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      style={style}
      aria-hidden
      {...props}
    >
      <rect width="48" height="48" rx="8" fill="#FFCB05" />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="14"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        elo
      </text>
    </svg>
  );
}
