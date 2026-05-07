export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card stat-card">
      <p className="stat-card-label">{label}</p>
      <h3 className="stat-card-value">{value}</h3>
      {hint ? <p className="stat-card-hint">{hint}</p> : null}
    </div>
  );
}
