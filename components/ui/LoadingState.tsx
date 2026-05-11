import { cn } from "@/lib/utils";

export function LoadingState({
  message = "Memuat data...",
  fullPage = false
}: {
  message?: string;
  fullPage?: boolean;
}) {
  return (
    <div className={cn("loading-state", fullPage && "login-screen")}>
      <span aria-hidden="true" className="loading-spinner" />
      <div className="state-copy">
        <strong>{message}</strong>
      </div>
    </div>
  );
}
