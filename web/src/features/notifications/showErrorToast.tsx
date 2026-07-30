import { toast } from "sonner";
import { ErrorNotification } from "@/src/features/notifications/ErrorNotification";

const toastErrorStyleProps = {
  border: "1px solid hsl(var(--destructive))",
  backgroundColor: "hsl(var(--destructive))",
};

const toastWarningStyleProps = {
  border: "1px solid var(--light-yellow)",
  backgroundColor: "var(--light-yellow)",
};

export const showErrorToast = (
  error: React.ReactNode,
  description: React.ReactNode,
  type: "WARNING" | "ERROR" = "ERROR",
  path?: string,
) => {
  toast.custom(
    (t) => (
      <ErrorNotification
        error={error}
        description={description}
        type={type}
        path={path}
        dismissToast={toast.dismiss}
        toast={t}
      />
    ),
    {
      duration: Infinity,
      style: {
        padding: "1rem",
        borderRadius: "0.5rem",
        ...(type === "ERROR" ? toastErrorStyleProps : toastWarningStyleProps),
      },
    },
  );
};
