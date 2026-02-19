/** Convert 0-1 fractional rating to 1-5 star scale */
export function toStarRating(fraction: number): number {
  return Math.round(fraction * 5 * 10) / 10;
}

/** Convert 1-5 star rating to 0-1 fraction */
export function toFraction(stars: number): number {
  return stars / 5;
}

/** Get filled star count for display (1-5) */
export function getFilledStars(rating: number): number {
  return Math.round(rating);
}
