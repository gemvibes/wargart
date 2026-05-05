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
      <strong>{message}</strong>
    </div>
  );
}

