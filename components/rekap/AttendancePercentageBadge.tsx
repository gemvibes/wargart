import { formatPercent } from "@/lib/utils";

export function AttendancePercentageBadge({ value }: { value: number }) {
  return (
    <div>
      <div className="list-row" style={{ justifyContent: "flex-start", marginBottom: 6 }}>
        <strong>{formatPercent(value)}</strong>
        <span className="helper-text">Persentase Kehadiran (%)</span>
      </div>
      <div className="progress">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

