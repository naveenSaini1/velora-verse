"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTrendingSearches } from "@/lib/api/search";

interface TrendingSearchesProps {
  onSelect: (query: string) => void;
}

export function TrendingSearches({ onSelect }: TrendingSearchesProps) {
  const [searches, setSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const data = await getTrendingSearches();
        setSearches(data);
      } catch {
        // Silently fail - trending searches are non-critical
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (isLoading || searches.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="size-4" />
        <span className="font-medium">Trending Searches</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((query) => (
          <Button
            key={query}
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onSelect(query)}
          >
            {query}
          </Button>
        ))}
      </div>
    </div>
  );
}
