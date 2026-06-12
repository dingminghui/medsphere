import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import type { ReactNode } from "react";

interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
  orientation?: "vertical" | "horizontal" | "both";
  type?: "auto" | "always" | "scroll" | "hover";
}

export function ScrollArea({
  children,
  className = "",
  viewportClassName = "",
  orientation = "vertical",
  type = "hover",
}: ScrollAreaProps) {
  const rootClassName = ["ui-scroll-area", className].filter(Boolean).join(" ");
  const viewportClass = ["ui-scroll-area__viewport", viewportClassName].filter(Boolean).join(" ");

  return (
    <ScrollAreaPrimitive.Root className={rootClassName} type={type}>
      <ScrollAreaPrimitive.Viewport className={viewportClass}>{children}</ScrollAreaPrimitive.Viewport>
      {orientation === "vertical" || orientation === "both" ? (
        <ScrollAreaPrimitive.Scrollbar
          className="ui-scroll-area__scrollbar ui-scroll-area__scrollbar--vertical"
          orientation="vertical"
        >
          <ScrollAreaPrimitive.Thumb className="ui-scroll-area__thumb" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null}
      {orientation === "horizontal" || orientation === "both" ? (
        <ScrollAreaPrimitive.Scrollbar
          className="ui-scroll-area__scrollbar ui-scroll-area__scrollbar--horizontal"
          orientation="horizontal"
        >
          <ScrollAreaPrimitive.Thumb className="ui-scroll-area__thumb" />
        </ScrollAreaPrimitive.Scrollbar>
      ) : null}
      {orientation === "both" ? <ScrollAreaPrimitive.Corner className="ui-scroll-area__corner" /> : null}
    </ScrollAreaPrimitive.Root>
  );
}
