"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  ExternalLink,
  MessageSquare,
  Star,
  Plus,
  Package,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { MiniApp } from "~/lib/types";
import { useMiniApp } from "@neynar/react";
import { Navigation } from "~/components/ui/Navigation";
import toast from "react-hot-toast";

export default function MyAppsPage() {
  const { context } = useMiniApp();
  const [myApps, setMyApps] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (context?.user?.fid) {
      fetchMyApps();
    }
  }, [context?.user?.fid]);

  const fetchMyApps = async () => {
    if (!context?.user?.fid) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/apps?ownerFid=${context.user.fid}`);
      const data = await response.json();
      setMyApps(data.apps || []);
    } catch (error) {
      console.error("Error fetching my apps:", error);
      toast.error("Failed to load your apps");
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen bg-black relative overflow-hidden text-white">
        <Navigation title="My Apps" />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center space-y-4">
            <Package className="w-16 h-16 text-purple-400 mx-auto" />
            <h2 className="text-2xl font-bold">Connect to View Your Apps</h2>
            <p className="text-gray-400 max-w-md mx-auto">
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
      <div className="min-h-screen bg-black relative overflow-hidden text-white">
        <Navigation title="My Apps" />
        <div className="flex items-center justify-center h-[80vh] flex-col space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-purple-500"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-purple-400 opacity-20"></div>
          </div>
          <p className="text-purple-300 text-lg">Loading your apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden text-white">
      <Navigation title="My Apps" />

      <div className="px-4 py-8 space-y-8 max-w-6xl mx-auto">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold  bg-clip-text ">
            Manage Your Apps
          </h1>
          <p className="text-gray-300 text-base">
            View and manage your registered mini apps with ease
          </p>
        </div>
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
          <h2 className="text-lg font-semibold w-full">
            Your Apps{" "}
            <span className="text-purple-400 text-base">({myApps.length})</span>
          </h2>
          <Button
            onClick={() => (window.location.href = "/add-app")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg px-2 py-1 text-xs font-medium shadow-md border border-purple-400/40"
          >
            <Plus className="" /> Add New
          </Button>
        </div>

        {myApps.length === 0 ? (
          <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-12 text-center shadow-lg border border-purple-500/30">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/40">
              <Package className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">No apps yet</h3>
            <p className="text-gray-400 mb-6">
              Start by adding your first mini app to collect feedback
            </p>
            <Button
              onClick={() => (window.location.href = "/add-app")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl px-4 py-2 text-sm font-medium shadow-lg border border-purple-400/40"
            >
              <Plus className="w-4 h-4 mr-2" /> Add First App
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myApps.map((app, index) => (
              <div
                key={app.appId}
                className="bg-black/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-purple-500/30 hover:border-purple-400/50 hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={app.iconUrl || "/icon.png"}
                      alt={app.name}
                      className="w-16 h-16 rounded-xl object-cover border border-purple-500/30 shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = "/icon.png";
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg truncate">{app.name}</h3>
                      <p className="text-gray-300 text-sm line-clamp-2 mt-1">
                        {app.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= app.averageRating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                      <span>{app.averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-400">
                      {app.totalFeedback} reviews
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => copyFeedbackLink(app.appId)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg py-2 text-xs font-medium border border-purple-400/30"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy Link
                    </Button>
                    <Button
                      onClick={() => openMiniApp(app.miniappUrl)}
                      className="bg-black/40 hover:bg-black/60 text-purple-300 rounded-lg py-2 text-xs border border-purple-500/30"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> Open App
                    </Button>
                  </div>

                  <Button
                    onClick={() =>
                      (window.location.href = `/feedback/${app.appId}`)
                    }
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg py-2 text-xs font-medium border border-green-500/30"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" /> View Reviews
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
