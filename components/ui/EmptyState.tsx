export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span aria-hidden="true" className="state-icon state-icon-empty">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H16a2 2 0 0 1 2 2v1h.5A2.5 2.5 0 0 1 21 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-7A2.5 2.5 0 0 1 5.5 7H6V6.5Zm2.5-.5a.5.5 0 0 0-.5.5V7h9V6h-8.5ZM5 9.5v7c0 .28.22.5.5.5h13a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5h-13a.5.5 0 0 0-.5.5Z" />
        </svg>
      </span>
      <div className="state-copy">
        <h3>{title}</h3>
        <p className="muted">{description}</p>
      </div>
    </div>
  );
}
