export default function RatingBadge({ value }) {
  if (value == null) return null;
  return <span className="text-indigo-300 font-mono font-bold text-sm">Rating: {value}</span>;
}