import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-900/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:shadow-cyan-500/10",
          description: "group-[.toast]:text-white/70",
          actionButton: "group-[.toast]:bg-cyan-500 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white/70",
          success: "group-[.toaster]:border-emerald-500/30",
          error: "group-[.toaster]:border-red-500/30",
          info: "group-[.toaster]:border-cyan-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
