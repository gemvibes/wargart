export function ErrorMessage({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state">
      <span aria-hidden="true" className="state-icon state-icon-error">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 2.75a9.25 9.25 0 1 0 0 18.5 9.25 9.25 0 0 0 0-18.5Zm0 5a1 1 0 0 1 1 1v4.5a1 1 0 1 1-2 0v-4.5a1 1 0 0 1 1-1Zm0 9.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
        </svg>
      </span>
      <div className="state-copy">
        <strong>Terjadi kendala</strong>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button className="button secondary" onClick={onRetry} type="button">
          Coba Lagi
        </button>
      ) : null}
    </div>
  );
}
