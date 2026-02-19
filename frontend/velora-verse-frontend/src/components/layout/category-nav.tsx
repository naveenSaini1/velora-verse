import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";

interface Category {
  name: string;
  slug: string;
  category_name: string;
}

interface CategoryNavProps {
  categories: Category[];
  className?: string;
}

export function CategoryNav({ categories, className }: CategoryNavProps) {
  if (!categories.length) return null;

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2 px-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={ROUTES.CATEGORY_DETAIL(category.slug)}
            className="inline-flex shrink-0 items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
          >
            {category.category_name}
          </Link>
        ))}
      </div>
    </div>
  );
}
