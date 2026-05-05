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
    <div className="card">
      <p className="muted">{label}</p>
      <h3 style={{ marginBottom: 8 }}>{value}</h3>
      {hint ? <p className="helper-text">{hint}</p> : null}
    </div>
  );
}

