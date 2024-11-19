"use client";

import { ReactNode, useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useDismiss,
  useRole,
  useInteractions,
  Placement,
} from "@floating-ui/react";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: Placement;
}

export function Tooltip({ children, content, position = "top" }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    placement: position,
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </div>

      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className="z-50"
        >
          <div className="bg-black border border-green-500 text-green-500 px-2 py-2 text-sm font-mono whitespace-nowrap">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
