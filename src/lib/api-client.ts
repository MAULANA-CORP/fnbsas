import { toast } from "sonner";

/** Toast error API. Kalau kena limit paket, tombol Upgrade ke halaman Langganan. */
export function toastApiError(json: { error?: string; type?: string } | null, fallback: string) {
  const msg = json?.error ?? fallback;
  if (json?.type === "subscription_limit") {
    toast.error(msg, {
      action: {
        label: "Upgrade",
        onClick: () => {
          window.location.href = "/langganan";
        },
      },
    });
    return;
  }
  toast.error(msg);
}
