/**
 * Utility for combining class names conditionally.
 * Filters out falsy values and joins the remaining strings.
 */
export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}