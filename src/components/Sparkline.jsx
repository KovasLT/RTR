/**
 * Tiny inline SVG sparkline. Pass an array of numbers; renders a smooth line
 * scaled to the available box. No axes/labels — meant to sit next to a value.
 */
const Sparkline = ({ values = [], width = 160, height = 40, className = '' }) => {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const rising = values[values.length - 1] >= values[0];
  const stroke = rising ? '#34d399' : '#f87171'; // emerald / red

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;
