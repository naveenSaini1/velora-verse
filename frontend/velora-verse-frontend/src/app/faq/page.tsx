import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import { ScrollReveal } from "@/components/animations";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Velora Verse — shipping, returns, payments, and more.",
};

const FAQ_SECTIONS = [
  {
    title: "Shipping & Delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "Delivery typically takes 2-4 business days for metro cities, 4-6 days for tier-2 cities, and 5-8 days for other locations. You can check estimated delivery times using the pincode checker on any product page.",
      },
      {
        q: "Is shipping free?",
        a: "Yes! We offer free shipping on all orders above Rs. 999. For orders under Rs. 999, a flat delivery charge of Rs. 49 applies.",
      },
      {
        q: "Can I track my order?",
        a: "Absolutely. Once your order ships, you'll receive a tracking number via email and you can track your delivery from your orders page in real time.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    items: [
      {
        q: "What is your return policy?",
        a: "We offer a 7-day return policy from the date of delivery. Items must be unused, unwashed, and in their original packaging with tags attached.",
      },
      {
        q: "How do I initiate a return?",
        a: "Go to your Orders page, select the order, and click 'Request Return'. You can choose your reason and preferred resolution (refund or exchange). Our team will arrange a pickup.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 5-7 business days after we receive and verify the returned item. The amount will be credited to your original payment method.",
      },
    ],
  },
  {
    title: "Payments",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept credit/debit cards (Visa, Mastercard, RuPay), UPI, net banking, and popular wallets through our secure payment gateway powered by Razorpay.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. We use Razorpay's PCI-DSS compliant payment gateway. Your card details are never stored on our servers and all transactions are encrypted.",
      },
      {
        q: "Can I use gift cards or loyalty points?",
        a: "Yes! You can apply gift cards and redeem loyalty points at checkout. These can be combined with other payment methods.",
      },
    ],
  },
  {
    title: "Account & Orders",
    items: [
      {
        q: "How do I create an account?",
        a: "Click 'Register' in the top-right corner, enter your email, name, and password. It takes less than 30 seconds!",
      },
      {
        q: "Can I modify or cancel an order?",
        a: "You can cancel an order as long as it hasn't been shipped yet. Go to your Orders page and click 'Cancel Order'. Unfortunately, modifications after placing an order aren't supported — but you can cancel and re-order.",
      },
      {
        q: "How do loyalty points work?",
        a: "You earn loyalty points on every purchase. Points accumulate in your account and can be redeemed at checkout for a discount on future orders. Check your Loyalty page for your current balance and history.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-3 mb-4 rounded-xl" asChild>
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <ScrollReveal direction="up" duration={0.5}>
      <h1 className="text-3xl font-bold tracking-tight mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-muted-foreground mb-8">
        Find answers to common questions below
      </p>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.15} duration={0.6}>
      <div className="space-y-8">
        {FAQ_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {section.items.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`${section.title}-${i}`}
                  className="rounded-xl border border-border/60 px-4 shadow-sm"
                >
                  <AccordionTrigger className="text-sm font-medium text-left hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.25} duration={0.5}>
      <div className="mt-10 rounded-2xl border border-border/60 bg-secondary/30 p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Didn&apos;t find what you were looking for?
        </p>
        <Button className="rounded-xl" asChild>
          <Link href={ROUTES.CONTACT}>Contact Us</Link>
        </Button>
      </div>
      </ScrollReveal>
    </div>
  );
}
