/**
 * Where the iPad goes: the walk-in's door, and on the wall to its left the
 * iPad hanging by its strap from a peg. How it hangs is not settled; this is
 * the study's guess. Line art, as the restock start's other pictures.
 */
export function HangIpadPicture({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 200 130"
    >
      <line className="stroke-(--border-color-strong)" x1="10" x2="190" y1="120" y2="120" />
      <rect height="92" rx="2" width="52" x="118" y="28" />
      <circle cx="160" cy="76" fill="currentColor" r="2.5" stroke="none" />
      <circle cx="70" cy="30" fill="currentColor" r="3.5" stroke="none" />
      <path d="M70 30 L50 52 M70 30 L90 52" />
      <rect height="38" rx="5" width="52" x="44" y="52" />
      <rect className="fill-success" height="26" stroke="none" width="12" x="64" y="58" />
    </svg>
  )
}
