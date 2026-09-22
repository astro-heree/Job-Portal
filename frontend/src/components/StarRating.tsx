export function StarRating({ rating, outOf = 5 }: { rating: number; outOf?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${rating} / ${outOf}`}>
      {Array.from({ length: outOf }, (_, index) => (
        <span key={index} className={index < rating ? "text-amber-400" : "text-slate-200"}>
          ★
        </span>
      ))}
    </span>
  );
}
