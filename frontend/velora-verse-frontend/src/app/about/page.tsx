import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Heart, Sparkles, Shield } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import { ScrollReveal } from "@/components/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Velora Verse — our story, mission, and values.",
};

const VALUES = [
  {
    icon: Heart,
    title: "Quality First",
    description:
      "Every product in our store is hand-picked for quality. We work directly with trusted suppliers to ensure you get nothing but the best.",
  },
  {
    icon: Sparkles,
    title: "Curated with Care",
    description:
      "We don't believe in overwhelming choices. Our collections are thoughtfully curated so you can discover pieces that truly bring joy.",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    description:
      "Honest pricing, clear return policies, and responsive support. We believe trust is earned through every interaction.",
  },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-3 mb-4 rounded-xl" asChild>
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <ScrollReveal direction="up" duration={0.5}>
      <h1 className="text-3xl font-bold tracking-tight mb-2">About Velora Verse</h1>
      <p className="text-muted-foreground mb-8">Our story, mission, and what drives us</p>
      </ScrollReveal>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Our Story</h2>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
              <p>
                Velora Verse started with a simple idea: shopping should feel personal, not
                overwhelming. In a world of endless options, we wanted to create a space where
                every product is chosen with intention and every experience feels warm.
              </p>
              <p>
                Founded with a passion for quality and a love for beautiful things, we set out
                to build more than just a store — we built a community. A place where you can
                discover products that fit your life, your style, and your values.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Our Mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To make quality accessible and shopping joyful. We believe that the things you
              surround yourself with should bring comfort and happiness — and finding them
              shouldn&apos;t be a chore. That&apos;s why we focus on curation over quantity,
              quality over trends, and people over transactions.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          {VALUES.map((value) => (
            <Card key={value.title} className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="p-6 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <value.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{value.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Get in Touch</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We love hearing from you! Whether you have a question, feedback, or just
              want to say hello —{" "}
              <Link href={ROUTES.CONTACT} className="text-primary hover:underline">
                reach out to us
              </Link>
              . We&apos;re always here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
