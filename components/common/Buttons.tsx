import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export function PrimaryButton({
  children,
  isLoading = false,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5C4A] focus-visible:ring-offset-1 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variantClasses = {
    primary: "bg-[#1F5C4A] text-white hover:bg-[#164638] shadow-sm",
    secondary: "bg-[#F0F1EE] text-[#181A19] hover:bg-[#E3E5E1] border border-[#E3E5E1]",
    danger: "bg-[#B94A48] text-white hover:bg-[#9E3B3A]",
    ghost: "bg-transparent text-[#181A19] hover:bg-[#F0F1EE]",
  };

  const sizeClasses = {
    sm: "h-9 px-3.5 text-xs rounded-lg gap-1.5",
    md: "h-11 px-5 text-sm rounded-xl gap-2",
    lg: "h-13 px-6 text-base rounded-xl gap-2.5",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
}

export function SecondaryButton(props: ButtonProps) {
  return <PrimaryButton variant="secondary" {...props} />;
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "active" | "danger";
}

export function IconButton({
  icon,
  label,
  size = "md",
  variant = "default",
  className = "",
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-12 h-12 rounded-xl",
  };

  const variantClasses = {
    default: "text-[#6C716D] hover:text-[#181A19] hover:bg-[#F0F1EE] active:bg-[#E3E5E1]",
    active: "text-[#1F5C4A] bg-[#E8F2EE] hover:bg-[#D5E8DF]",
    danger: "text-[#B94A48] hover:bg-[#FBEAEA]",
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5C4A] cursor-pointer ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
