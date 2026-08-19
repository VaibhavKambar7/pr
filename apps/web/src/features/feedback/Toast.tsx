import { Button } from "../../components/ui/button";

type ToastProps = {
  message: string;
  tone?: "error" | "success";
  onDismiss: () => void;
};

export function Toast({ message, tone = "error", onDismiss }: ToastProps) {
  return (
    <div className={`toast ${tone}`} role="status">
      <span>{message}</span>
      <Button aria-label="Dismiss notification" onClick={onDismiss} type="button" variant="ghost">
        Dismiss
      </Button>
    </div>
  );
}
