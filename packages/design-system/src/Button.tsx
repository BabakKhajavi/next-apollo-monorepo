import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-700",
  secondary: "border border-zinc-300 text-zinc-900 hover:bg-zinc-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
