import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      duration={1600}
      gap={6}
      visibleToasts={2}
      closeButton={false}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: [
            // Pill / snackbar shape
            "group toast",
            "flex items-center gap-2",
            // Compact — ~36px tall
            "py-2 px-4",
            "rounded-full",
            // Dark semi-transparent background (Telegram/iOS style)
            "bg-slate-900/88 backdrop-blur-md",
            "text-white",
            // No border — dark bg handles contrast
            "border-0",
            // Minimal shadow
            "shadow-lg shadow-black/20",
            // Typography
            "text-[12.5px] font-medium leading-none",
            // Width — auto, not full-width
            "w-auto max-w-[280px] mx-auto",
            // Cursor
            "cursor-default select-none",
          ].join(" "),

          // Icon — small, dim slightly for success/etc.
          icon: "w-3.5 h-3.5 shrink-0 opacity-90",

          description: "text-[11px] text-white/70 font-normal",

          actionButton:
            "text-[11px] font-bold text-emerald-400 ml-1 hover:text-emerald-300 transition-colors",
          cancelButton:
            "text-[11px] font-medium text-white/60 ml-1 hover:text-white/80 transition-colors",
        },
      }}
      // Position above bottom nav:
      // bottom nav is ~64px + safe-area. We offset by 80px + safe-area.
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)",
        left: "50%",
        transform: "translateX(-50%)",
        right: "auto",
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
