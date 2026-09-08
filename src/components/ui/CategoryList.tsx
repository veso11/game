import Link from 'next/link';

interface CategoryItem {
  href: string;
  title: string;
  subtitle?: string;
}

export function CategoryList({ items }: { items: CategoryItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 shadow-sm hover:border-accent"
        >
          <div>
            <p className="font-semibold text-ink">{item.title}</p>
            {item.subtitle && <p className="text-xs text-ink-muted">{item.subtitle}</p>}
          </div>
          <span className="text-ink-muted">›</span>
        </Link>
      ))}
    </div>
  );
}
