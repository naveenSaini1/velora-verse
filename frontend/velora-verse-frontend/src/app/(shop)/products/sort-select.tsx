"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, ROUTES } from "@/lib/utils/constants";

export function SortSelectClient({ currentValue }: { currentValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(":");
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort_by", sortBy);
    params.set("sort_order", sortOrder);
    params.delete("page"); // Reset to page 1 on sort change
    router.push(`${ROUTES.PRODUCTS}?${params.toString()}`);
  };

  return (
    <Select
      defaultValue={currentValue || SORT_OPTIONS[0].value}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
