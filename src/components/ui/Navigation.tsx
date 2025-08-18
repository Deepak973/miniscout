"use client";

import { ArrowLeft, Home, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavigationProps {
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
  showAddApp?: boolean;
  onBack?: () => void;
  onAddApp?: () => void;
}

export function Navigation({
  title,
  showBack = true,
  showHome = true,
  showAddApp = false,
  onBack,
  onAddApp,
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

  const handleAddApp = () => {
    if (onAddApp) {
      onAddApp();
    } else {
      router.push("/add-app");
    }
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

          {/* Small Rotating Logo */}
          <div className="relative">
            <img
              src="/logo.png"
              alt="MiniScout"
              className="w-8 h-8 rounded-full object-cover animate-spin"
              style={{ animationDuration: "10s" }}
            />
          </div>

          {title && (
            <h1 className="text-lg font-black text-white truncate">{title}</h1>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {showAddApp && (
            <button
              onClick={handleAddApp}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50"
              aria-label="Add new mini app"
            >
              <Plus className="w-5 h-5 text-purple-300" />
            </button>
          )}

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
    </div>
  );
}
