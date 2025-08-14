"use client";

import { Package, Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  position?: "left" | "right";
  className?: string;
  buttonText?: string;
}

export function FloatingActionButton({
  onClick,
  position = "right",
  className = "",
  buttonText,
}: FloatingActionButtonProps) {
  const isTextButton = buttonText && buttonText !== "Add New";

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 ${position === "right" ? "right-6" : "left-6"} z-50
        ${
          isTextButton
            ? "px-4 py-2 rounded-xl text-sm font-medium"
            : "w-16 h-16 rounded-full"
        }
        bg-gradient-to-r from-purple-600 to-blue-600
        hover:from-purple-700 hover:to-blue-700
        shadow-2xl hover:shadow-purple-500/30
        transform hover:scale-110
        transition-all duration-300 ease-in-out
        flex items-center justify-center
        border border-purple-400/30
        text-white
        ${className}
      `}
      aria-label={buttonText || "Action button"}
    >
      {buttonText === "Add New" ? (
        <Plus className="w-6 h-6 text-white" />
      ) : buttonText ? (
        <div className="flex items-center space-x-1">
          <Package className="w-3 h-3" />
          <span>{buttonText}</span>
        </div>
      ) : (
        <Plus className="w-6 h-6 text-white" />
      )}
    </button>
  );
}
