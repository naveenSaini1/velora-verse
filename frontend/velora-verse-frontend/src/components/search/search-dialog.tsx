"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Clock, TrendingUp, X } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDebounce } from "@/lib/hooks/use-debounce";
import {
  autocomplete,
  getRecentSearches,
  getPopularSearches,
  removeRecentSearch,
} from "@/lib/api/search";
import { ROUTES } from "@/lib/utils/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FrappeImage } from "@/components/shared/frappe-image";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface Suggestion {
  value: string;
  label: string;
  image?: string;
}

export function SearchDialog() {
  const router = useRouter();
  const { searchDialogOpen, setSearchDialogOpen } = useUIStore();
  const { isLoggedIn } = useAuthStore();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchDialogOpen(!searchDialogOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchDialogOpen, setSearchDialogOpen]);

  // Fetch recent and popular searches when dialog opens
  useEffect(() => {
    if (!searchDialogOpen) return;

    if (isLoggedIn) {
      getRecentSearches().then(setRecentSearches).catch(() => {});
    }
    getPopularSearches().then(setPopularSearches).catch(() => {});
  }, [searchDialogOpen, isLoggedIn]);

  // Fetch autocomplete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery.trim()) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await autocomplete(debouncedQuery.trim());
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Reset query when dialog closes
  useEffect(() => {
    if (!searchDialogOpen) {
      setQuery("");
      setSuggestions([]);
    }
  }, [searchDialogOpen]);

  const navigateAndClose = useCallback(
    (path: string) => {
      setSearchDialogOpen(false);
      router.push(path);
    },
    [router, setSearchDialogOpen]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion) => {
      navigateAndClose(ROUTES.PRODUCT_DETAIL(suggestion.value));
    },
    [navigateAndClose]
  );

  const handleSearchSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigateAndClose(`${ROUTES.SEARCH}?q=${encodeURIComponent(trimmed)}`);
  }, [query, navigateAndClose]);

  const handleQuickSearch = useCallback(
    (term: string) => {
      navigateAndClose(
        `${ROUTES.SEARCH}?q=${encodeURIComponent(term)}`
      );
    },
    [navigateAndClose]
  );

  const handleRemoveRecent = useCallback(
    async (term: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setRecentSearches((prev) => prev.filter((s) => s !== term));
      try {
        await removeRecentSearch(term);
      } catch {
        // Silently fail
      }
    },
    []
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const showIdle = !query.trim();
  const showSuggestions = query.trim().length > 0;

  return (
    <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
      <DialogContent
        className="top-[20%] translate-y-0 sm:max-w-lg p-0 gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search Products</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="flex items-center border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products..."
            className="border-0 shadow-none focus-visible:ring-0 h-12"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <ScrollArea className="max-h-80">
          <div className="p-3">
            {/* Idle state: recent + popular searches */}
            {showIdle && (
              <div className="space-y-4">
                {/* Recent searches (logged-in users only) */}
                {isLoggedIn && recentSearches.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      <span className="font-medium">Recent Searches</span>
                    </div>
                    <div className="space-y-0.5">
                      {recentSearches.map((term) => (
                        <div
                          key={term}
                          className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors cursor-pointer"
                          onClick={() => handleQuickSearch(term)}
                        >
                          <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate">{term}</span>
                          <button
                            onClick={(e) => handleRemoveRecent(term, e)}
                            className="shrink-0 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity"
                            aria-label={`Remove "${term}" from recent searches`}
                          >
                            <X className="size-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular searches */}
                {popularSearches.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="size-4" />
                      <span className="font-medium">Popular Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((term) => (
                        <Button
                          key={term}
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleQuickSearch(term)}
                        >
                          {term}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state when no recent or popular searches */}
                {recentSearches.length === 0 && popularSearches.length === 0 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Start typing to search for products
                  </div>
                )}
              </div>
            )}

            {/* Loading state */}
            {isSearching && showSuggestions && (
              <LoadingSpinner size="sm" className="py-6" />
            )}

            {/* Suggestions */}
            {!isSearching && showSuggestions && (
              <div className="space-y-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.value}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent transition-colors"
                  >
                    {suggestion.image && (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                        <FrappeImage
                          src={suggestion.image}
                          alt={suggestion.label}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <span className="flex-1 truncate">{suggestion.label}</span>
                  </button>
                ))}

                {/* "Search for" option */}
                <button
                  onClick={handleSearchSubmit}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent transition-colors text-muted-foreground"
                >
                  <Search className="size-4 shrink-0" />
                  <span className="flex-1">
                    Search for &quot;{query.trim()}&quot;
                  </span>
                  <ArrowRight className="size-4 shrink-0" />
                </button>
              </div>
            )}

            {/* No results */}
            {!isSearching &&
              showSuggestions &&
              suggestions.length === 0 &&
              debouncedQuery === query.trim() && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <p>No products found</p>
                  <button
                    onClick={handleSearchSubmit}
                    className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Search for &quot;{query.trim()}&quot;
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
