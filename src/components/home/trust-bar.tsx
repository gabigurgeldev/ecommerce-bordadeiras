import Link from "next/link";
import type { TrustBarItem } from "@/lib/data/trust-bar";
import { getTrustIcon } from "@/lib/trust-icons";

export function TrustBar({ items }: { items: TrustBarItem[] }) {
  if (items.length === 0) return null;

  return (
    <section
      className="relative z-10 border-y border-[#4a3628] bg-[#5c4332] shadow-[0_2px_16px_rgba(61,46,34,0.2)]"
      aria-label="Garantias da loja"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth py-5 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:py-6 lg:grid-cols-4 lg:gap-5 lg:py-6 [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const Icon = getTrustIcon(item.icon);
            const content = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5e9d8]/12 ring-1 ring-[#f5e9d8]/20 transition-colors group-hover:bg-[#f5e9d8]/18">
                  <Icon
                    className="h-5 w-5 text-[#f5e9d8]"
                    weight="regular"
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight tracking-tight text-[#faf6ef] sm:text-[0.95rem]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-[#f5e9d8]/80 sm:text-[0.8125rem]">
                    {item.description}
                  </p>
                </div>
              </>
            );

            return (
              <li
                key={item.id}
                className="flex min-w-[82%] snap-start sm:min-w-0"
              >
                {item.link ? (
                  <Link
                    href={item.link}
                    className="group flex w-full items-center gap-3 rounded-lg px-0.5 py-0.5 transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5e9d8]/50"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="group flex w-full items-center gap-3">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
