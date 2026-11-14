// A hand-drawn ganache-drizzle stroke, echoing the drizzle on the shop's
// actual bowl cakes. Used under category headings instead of a plain
// rule, so the page's structure carries a bit of the brand's own visual
// language rather than a generic divider line.
export default function DrizzleDivider({ color = "var(--color-gold)", className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 14"
      width="110"
      height="7"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 7c10-8 18 8 28 0s18-8 28 0 18 8 28 0 18-8 28 0 18 8 28 0 18-8 28 0 18 8 28 0"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
