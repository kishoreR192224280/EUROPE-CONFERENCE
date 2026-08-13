type QonnectLogoProps = {
  variant?: "full" | "mark" | "light";
  className?: string;
  title?: string;
};

const SRC = {
  full: "/brand/qonnect-logo.svg",
  mark: "/brand/qonnect-mark.svg",
  light: "/brand/qonnect-logo-light.svg",
} as const;

export function QonnectLogo({
  variant = "full",
  className = "h-8 w-auto",
  title = "Qonnect",
}: QonnectLogoProps) {
  return (
    <img
      src={SRC[variant]}
      alt={title}
      className={className}
      draggable={false}
    />
  );
}
