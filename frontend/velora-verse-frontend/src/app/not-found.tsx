import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      {/* Warm illustrated icon area */}
      <div className="relative mb-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
          <Search className="h-12 w-12 text-primary" strokeWidth={1.5} />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary/20" />
        <div className="absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-primary/15" />
        <div className="absolute top-1/2 -right-6 h-2 w-2 rounded-full bg-primary/10" />
      </div>

      {/* Friendly heading */}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Oops, we can&apos;t find that page
      </h1>
      <p className="mt-3 text-muted-foreground max-w-md text-base leading-relaxed">
        It looks like this page has wandered off. Don&apos;t worry though, there
        are plenty of lovely things waiting for you back at the store.
      </p>

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" className="rounded-2xl px-8">
          <Link href="/">
            Take Me Home
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-2xl px-8">
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>

      {/* Subtle 404 watermark */}
      <p className="mt-12 text-7xl font-bold text-muted/50 select-none sm:text-8xl">
        404
      </p>
    </div>
  );
}
