interface AppLogoProps {
  size?: number;
  className?: string;
}

export function AppLogo({ size = 32, className = "" }: AppLogoProps) {
  const classNames = ["app-logo", className].filter(Boolean).join(" ");

  return (
    <img
      className={classNames}
      src="/android-chrome-192x192.png"
      width={size}
      height={size}
      alt="MedSphere"
      decoding="async"
    />
  );
}
