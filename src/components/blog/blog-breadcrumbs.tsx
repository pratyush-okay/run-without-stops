import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/seo/breadcrumbs";

export function BlogBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[11px] leading-5 text-white/45">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {last ? (
                <span className="text-white/70">{item.name}</span>
              ) : (
                <Link className="hover:text-white" href={item.path}>
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
