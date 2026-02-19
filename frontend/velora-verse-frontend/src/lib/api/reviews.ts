import { frappeCall, frappeGet } from "./client";
import type { Review, ReviewSummary } from "@/types/review";

export async function getReviews(params: {
  item: string;
  limit?: number;
  offset?: number;
  sort_by?: "newest" | "oldest" | "highest" | "lowest" | "helpful";
}) {
  return frappeGet<{ reviews: Review[]; average_rating: number }>(
    "velora_verse.velora_verse.doctype.review.review.get_reviews",
    params as Record<string, unknown>
  );
}

export async function getReviewSummary(item: string) {
  return frappeGet<ReviewSummary>(
    "velora_verse.velora_verse.doctype.review.review.get_review_summary",
    { item }
  );
}

export async function addReview(data: {
  item: string;
  rating: number;
  review_title?: string;
  review_text?: string;
  variant?: string;
}) {
  return frappeCall<{ message: string; review: string }>(
    "velora_verse.velora_verse.doctype.review.review.add_review",
    data
  );
}

export async function markReviewHelpful(reviewName: string) {
  return frappeCall<{ helpful_count: number }>(
    "velora_verse.velora_verse.doctype.review.review.mark_review_helpful",
    { review_name: reviewName }
  );
}
