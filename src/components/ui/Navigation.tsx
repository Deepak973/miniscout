"use client";

import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavigationProps {
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
  onBack?: () => void;
}

export function Navigation({
  title,
  showBack = true,
  showHome = true,
  onBack,
}: NavigationProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    router.push("/");
  };

  return (
    <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-purple-500/20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-purple-300" />
            </button>
          )}
          {title && (
            <h1 className="text-lg font-black text-white truncate">{title}</h1>
          )}
        </div>

        {showHome && (
          <button
            onClick={handleHome}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50"
            aria-label="Go home"
          >
            <Home className="w-5 h-5 text-purple-300" />
          </button>
        )}
      </div>
    </div>
  );
}
