import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      duration={2200}
      gap={8}
      visibleToasts={3}
      closeButton={false}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: [
            // Base
            "group toast",
            "flex items-center gap-2.5",
            // Size — compact
            "min-h-0 py-2.5 px-3.5",
            "rounded-xl",
            // Colours — light, clean
            "bg-white/95 backdrop-blur-sm",
            "text-slate-800",
            "border border-slate-200/80",
            // Shadow — subtle
            "shadow-md shadow-black/[0.06]",
            // Typography
            "text-[13px] font-medium leading-snug",
            // Width
            "max-w-[320px] w-auto",
          ].join(" "),

          // Success: thin left accent instead of heavy icon bg
          success: [
            "border-l-[3px] border-l-emerald-500",
            "border border-slate-200/80",
          ].join(" "),

          // Error: rose accent
          error: [
            "border-l-[3px] border-l-rose-500",
            "border border-slate-200/80",
          ].join(" "),

          // Warning: amber accent
          warning: [
            "border-l-[3px] border-l-amber-400",
            "border border-slate-200/80",
          ].join(" "),

          // Info: blue accent
          info: [
            "border-l-[3px] border-l-blue-500",
            "border border-slate-200/80",
          ].join(" "),

          description: "text-[12px] text-slate-500 font-normal mt-0.5",
          actionButton:
            "text-[12px] font-semibold bg-slate-900 text-white px-3 py-1 rounded-lg hover:bg-slate-700 transition-colors",
          cancelButton:
            "text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors",

          // Icon — smaller, no heavy bg
          icon: "w-4 h-4 shrink-0 opacity-80",
        },
        style: {
          // Prevent sonner from overriding our compact padding
          padding: undefined,
        },
      }}
      style={{
        // Position below safe area / header — works with pt-safe on mobile
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
