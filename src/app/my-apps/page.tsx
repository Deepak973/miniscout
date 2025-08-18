"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Copy,
  ExternalLink,
  Star,
  Plus,
  Package,
  ArrowLeft,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { MiniApp } from "~/lib/types";
import { useMiniApp } from "@neynar/react";
import toast from "react-hot-toast";

export default function MyAppsPage() {
  const { context } = useMiniApp();
  const [myApps, setMyApps] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyApps = useCallback(async () => {
    if (!context?.user?.fid) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/apps?ownerFid=${context.user.fid}`);
      const data = await response.json();
      setMyApps(data.apps || []);
    } catch (_error) {
      console.error("Error fetching my apps:", _error);
      toast.error("Failed to load your apps");
    } finally {
      setLoading(false);
    }
  }, [context?.user?.fid]);

  useEffect(() => {
    if (context?.user?.fid) {
      fetchMyApps();
    }
  }, [context?.user?.fid, fetchMyApps]);

  const copyFeedbackLink = async (appId: string) => {
    const feedbackUrl = `${window.location.origin}/feedback/${appId}`;
    try {
      await navigator.clipboard.writeText(feedbackUrl);
      toast.success("Feedback link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const openMiniApp = (miniappUrl: string) => {
    window.open(miniappUrl, "_blank");
  };

  if (!context?.user?.fid) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#B6B09F]/10 via-black to-[#EAE4D5]/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,242,242,0.1),transparent_50%)]"></div>

        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#F2F2F2]/20">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-lg bg-[#F2F2F2]/10 hover:bg-[#F2F2F2]/20 transition-all duration-300 border border-[#F2F2F2]/30"
              >
                <ArrowLeft className="w-5 h-5 text-[#F2F2F2]" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#F2F2F2] to-[#EAE4D5] rounded-full blur opacity-30 animate-pulse"></div>
                  <img
                    src="/logo.png"
                    alt="MiniScout"
                    className="w-8 h-8 rounded-full object-cover animate-spin relative z-10"
                    style={{ animationDuration: "10s" }}
                  />
                </div>
                <h1 className="text-lg font-bold text-[#F2F2F2] roboto-mono-400">
                  My Apps
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center h-[80vh] relative z-10">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#F2F2F2] to-[#EAE4D5] rounded-full blur opacity-30 animate-pulse"></div>
              <Package className="w-16 h-16 text-[#B6B09F] mx-auto relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-[#F2F2F2] roboto-mono-400">
              Connect to View Your Apps
            </h2>
            <p className="text-[#B6B09F] max-w-md mx-auto roboto-mono-400">
              Please connect your Farcaster account to view your registered
              apps.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#B6B09F]/10 via-black to-[#EAE4D5]/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,242,242,0.1),transparent_50%)]"></div>

        <div className="flex items-center justify-center h-screen relative z-10">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-[#F2F2F2] mx-auto mb-6"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-[#F2F2F2] opacity-20"></div>
            </div>
            <p className="text-[#F2F2F2] text-lg font-medium roboto-mono-400">
              Loading your apps...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#B6B09F]/10 via-black to-[#EAE4D5]/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,242,242,0.1),transparent_50%)]"></div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#F2F2F2]/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg bg-[#F2F2F2]/10 hover:bg-[#F2F2F2]/20 transition-all duration-300 border border-[#F2F2F2]/30"
            >
              <ArrowLeft className="w-5 h-5 text-[#F2F2F2]" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#F2F2F2] to-[#EAE4D5] rounded-full blur opacity-30 animate-pulse"></div>
                <img
                  src="/logo.png"
                  alt="MiniScout"
                  className="w-8 h-8 rounded-full object-cover relative z-10"
                />
              </div>
              <h1 className="text-lg font-bold text-[#F2F2F2] roboto-mono-400">
                My Apps
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => (window.location.href = "/add-app")}
              className="p-2 rounded-lg bg-[#F2F2F2] hover:bg-[#F2F2F2]/80 transition-all duration-300 shadow-lg shadow-[#F2F2F2]/25 text-black"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#F2F2F2] to-[#EAE4D5] rounded-full blur opacity-30 animate-pulse"></div>
              <Package className="w-16 h-16 text-[#F2F2F2] relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F2F2F2] roboto-mono-400">
                My Mini Apps
              </h1>
              <p className="text-[#B6B09F] text-sm roboto-mono-400">
                Manage your registered mini apps
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-black/50 backdrop-blur-xl rounded-xl p-4 border border-[#F2F2F2]/30">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#F2F2F2] roboto-mono-400">
              {myApps.length}
            </div>
            <div className="text-sm text-[#B6B09F] roboto-mono-400">
              Registered Apps
            </div>
          </div>
        </div>

        {/* Apps List */}
        {myApps.length === 0 ? (
          <div className="bg-black/50 backdrop-blur-xl rounded-xl p-12 text-center border border-[#F2F2F2]/30">
            <div className="w-24 h-24 bg-[#F2F2F2]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#F2F2F2]/30">
              <Package className="w-12 h-12 text-[#B6B09F]" />
            </div>
            <h3 className="text-xl font-bold text-[#F2F2F2] mb-2 roboto-mono-400">
              No apps yet
            </h3>
            <p className="text-[#B6B09F] mb-6 roboto-mono-400">
              Start by registering your first mini app!
            </p>
            <Button
              onClick={() => (window.location.href = "/add-app")}
              className="bg-[#F2F2F2] hover:bg-[#F2F2F2]/80 rounded-lg px-6 py-2 text-sm font-medium text-black shadow-lg shadow-[#F2F2F2]/25 transition-all duration-300"
            >
              Add First App
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {myApps.map((app) => (
              <div
                key={app.appId}
                className="bg-black/50 backdrop-blur-xl rounded-xl p-4 border border-[#F2F2F2]/30 hover:border-[#F2F2F2]/50 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#F2F2F2] to-[#EAE4D5] rounded-lg blur opacity-20"></div>
                      <img
                        src={app.iconUrl}
                        alt={app.name}
                        className="w-16 h-16 rounded-lg object-cover relative z-10"
                        onError={(e) => {
                          e.currentTarget.src = "/icon.png";
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[#F2F2F2] truncate roboto-mono-400">
                      {app.name}
                    </h3>
                    <p className="text-[#B6B09F] text-sm mt-1 overflow-hidden text-ellipsis display-webkit-box -webkit-line-clamp-2 -webkit-box-orient-vertical roboto-mono-400">
                      {app.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-[#F2F2F2] fill-current" />
                        <span className="text-sm text-[#F2F2F2] roboto-mono-400">
                          {app.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-[#B6B09F] roboto-mono-400">
                        {app.totalRatings} reviews
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
                    <Button
                      onClick={() => copyFeedbackLink(app.appId)}
                      className="bg-[#F2F2F2]/20 hover:bg-[#F2F2F2]/30 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-[#F2F2F2] border border-[#F2F2F2]/30 flex-1 sm:flex-none transition-all duration-300"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                    </Button>
                    <Button
                      onClick={() => openMiniApp(app.miniappUrl)}
                      className="bg-[#F2F2F2] hover:bg-[#F2F2F2]/80 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-black border border-[#F2F2F2] flex-1 sm:flex-none shadow-lg shadow-[#F2F2F2]/25 transition-all duration-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
