export function ErrorMessage({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state">
      <strong>Terjadi kendala</strong>
      <p>{message}</p>
      {onRetry ? (
        <button className="button secondary" onClick={onRetry} type="button">
          Coba Lagi
        </button>
      ) : null}
    </div>
  );
}

