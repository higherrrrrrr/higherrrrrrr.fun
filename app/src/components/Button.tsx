import clsx from "clsx";
import { ComponentProps, PropsWithChildren } from "react";

export function Button({
  children,
  className,
  ...rest
}: PropsWithChildren<ComponentProps<"button">>) {
  return (
    <button
      className={clsx(
        "min-w-[200px] border border-green-600 hover:bg-green-600 hover:text-black py-2",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
