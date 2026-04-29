import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      duration={1600}
      visibleToasts={2}
      closeButton={false}
      toastOptions={{
        classNames: {
          toast: [
            // Pill / snackbar shape
            "group toast",
            "flex items-center gap-2",
            // Compact — ~32px-40px tall
            "py-2 px-3.5",
            "rounded-full",
            // Lighter translucent background (Clean modern SaaS feel)
            "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
            "text-slate-800 dark:text-slate-100",
            // Subtle border
            "border border-slate-200/60 dark:border-slate-800/60",
            // Minimal soft shadow
            "shadow-sm shadow-black/5",
            // Typography
            "text-[12.5px] font-semibold leading-none tracking-tight",
            // Width — auto, not full-width
            "w-auto max-w-[280px] mx-auto",
            // Cursor
            "cursor-default select-none",
          ].join(" "),

          // Icon — small, dim slightly
          icon: "w-3.5 h-3.5 shrink-0 opacity-80",

          description: "text-[11px] text-slate-500 dark:text-slate-400 font-normal",

          actionButton:
            "text-[11px] font-bold text-emerald-600 dark:text-emerald-400 ml-1 hover:opacity-80 transition-opacity",
          cancelButton:
            "text-[11px] font-medium text-slate-500 dark:text-slate-400 ml-1 hover:opacity-80 transition-opacity",
        },
      }}
      // Position slightly above bottom nav
      // Assuming bottom nav is ~64px, + 16px spacing = ~80px
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
        left: "50%",
        transform: "translateX(-50%)",
        right: "auto",
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
