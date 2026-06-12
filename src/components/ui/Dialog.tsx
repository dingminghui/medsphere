import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="ui-dialog-overlay" />
        <DialogPrimitive.Content className="glass-card ui-dialog-content">
          <div className="glass-card__glow glass-card__glow--blue" aria-hidden />
          <div className="glass-card__inner ui-dialog-content__inner">
            <DialogPrimitive.Title className="ui-dialog-title">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="ui-dialog-description">
                {description}
              </DialogPrimitive.Description>
            ) : null}
            {children}
          </div>
          <DialogPrimitive.Close className="ui-dialog-close" aria-label="关闭">
            ×
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
