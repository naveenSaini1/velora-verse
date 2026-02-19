"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContact } from "@/lib/api/contact";
import { ScrollReveal } from "@/components/animations";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function validate(): string | null {
    if (!form.name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return "Please enter a valid email address.";
    if (!form.subject.trim()) return "Subject is required.";
    if (form.subject.trim().length < 3) return "Subject must be at least 3 characters.";
    if (!form.message.trim()) return "Message is required.";
    if (form.message.trim().length < 10) return "Message must be at least 10 characters.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await submitContact(form);
      setSuccessMsg(result?.message || "Message sent successfully!");
      setSubmitted(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-3 mb-4 rounded-xl" asChild>
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Home
        </Link>
      </Button>

      <ScrollReveal direction="up" duration={0.5}>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Contact Us</h1>
      <p className="text-muted-foreground mb-8">We&apos;d love to hear from you</p>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.15} duration={0.6}>
      <div className="grid gap-6 md:grid-cols-5">
        {/* Contact info */}
        <div className="md:col-span-2 space-y-4">
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a href="mailto:support@veloraverse.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    support@veloraverse.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+91 98765 43210</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">Mumbai, Maharashtra, India</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact form */}
        <div className="md:col-span-3">
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="p-6">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 animate-fade-in">
                  <CheckCircle className="h-10 w-10 text-primary" />
                  <p className="font-medium">{successMsg}</p>
                  <Button
                    variant="outline"
                    className="rounded-xl mt-2"
                    onClick={() => setSubmitted(false)}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="Your name"
                        className="rounded-xl"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        placeholder="you@example.com"
                        className="rounded-xl"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                      placeholder="What's this about?"
                      className="rounded-xl"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      placeholder="Tell us more..."
                      rows={5}
                      className="rounded-xl"
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </ScrollReveal>
    </div>
  );
}
