"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Search,
  MessageSquare,
  ExternalLink,
  TrendingUp,
  Users,
  Award,
  Plus,
  Package,
  Sparkles,
  Zap,
  Heart,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { MiniApp } from "~/lib/types";
import { useMiniApp } from "@neynar/react";
import { Navigation } from "~/components/ui/Navigation";
import { FloatingActionButton } from "~/components/ui/FloatingActionButton";
import toast from "react-hot-toast";

export default function HomePage() {
  const { context } = useMiniApp();
  const [allApps, setAllApps] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState<MiniApp[]>([]);

  useEffect(() => {
    fetchAllApps();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredApps(allApps);
    } else {
      const filtered = allApps.filter((app) =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  }, [searchTerm, allApps]);

  const fetchAllApps = async () => {
    setLoading(true);
    try {
      const appsResponse = await fetch("/api/apps");
      const appsData = await appsResponse.json();
      setAllApps(appsData.apps || []);
    } catch (error) {
      console.error("Error fetching apps:", error);
      toast.error("Failed to load apps data");
    } finally {
      setLoading(false);
    }
  };

  const handleProvideFeedback = (appId: string) => {
    window.location.href = `/feedback/${appId}`;
  };

  const handleAddNewApp = () => {
    window.location.href = "/add-app";
  };
  const handleMyApps = () => {
    window.location.href = "/my-apps";
  };

  const getTotalReviews = () =>
    allApps.reduce((sum, app) => sum + app.totalRatings, 0);
  const getAverageRating = () => {
    if (allApps.length === 0) return 0;
    return (
      allApps.reduce((sum, app) => sum + app.averageRating, 0) / allApps.length
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>

        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-purple-500 mx-auto mb-6"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-purple-400 opacity-20"></div>
            </div>
            <p className="text-purple-300 text-lg font-medium">
              Loading amazing apps...
            </p>
            <div className="flex justify-center mt-4 space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10">
        <Navigation title="MiniScout" showBack={false} showHome={false} />

        <div className="px-4 py-6 space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-30 animate-pulse"></div>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-tight">
                MiniScout
              </h1>
              <div className="flex justify-center items-center space-x-2">
                <Heart className="w-5 h-5 text-pink-500 animate-pulse" />
                <p className="text-gray-300 text-lg max-w-2xl mx-auto font-medium">
                  Explore, rate, and discover the best mini apps in the
                  Farcaster ecosystem
                </p>
                <Heart className="w-5 h-5 text-pink-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
              <div className="text-center">
                <div className="text-2xl font-black text-purple-400">
                  {allApps.length}
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  Total Apps
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-green-500/20 hover:border-green-400/40 transition-all duration-300">
              <div className="text-center">
                <div className="text-2xl font-black text-green-400">
                  {getTotalReviews()}
                </div>
                <div className="text-xs text-gray-400 font-medium">Reviews</div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300">
              <div className="text-center">
                <div className="text-2xl font-black text-yellow-400">
                  {getAverageRating().toFixed(1)}
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  Avg Rating
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for amazing mini apps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 w-full border-0 bg-transparent text-lg focus:ring-0 focus:outline-none placeholder-gray-500 text-white"
                />
              </div>
              {searchTerm && (
                <p className="text-sm text-purple-300 mt-2 ml-4">
                  Found {filteredApps.length} apps for &quot;{searchTerm}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Apps Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">Featured Apps</h2>
              <div className="text-sm text-gray-400 font-medium">
                {filteredApps.length} apps
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-12 text-center shadow-2xl border border-purple-500/20">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/30">
                  <MessageSquare className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {searchTerm ? "No apps found" : "No apps yet"}
                </h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm
                    ? "Try a different search term or browse all apps."
                    : "Be the first to add an amazing mini app!"}
                </p>
                {searchTerm ? (
                  <Button
                    onClick={() => setSearchTerm("")}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl px-4 py-2 text-sm font-medium shadow-lg border border-purple-400/30"
                  >
                    Clear Search
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddNewApp}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl px-4 py-2 text-sm font-medium shadow-lg border border-purple-400/30"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add First App
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredApps.map((app, index) => (
                  <div
                    key={app.appId}
                    className="group bg-black/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-purple-500/20 hover:border-purple-400/40 hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] cursor-pointer relative overflow-hidden"
                    onClick={() => handleProvideFeedback(app.appId)}
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10 space-y-4">
                      {/* App Header */}
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          <img
                            src={app.iconUrl || "/icon.png"}
                            alt={app.name}
                            className="w-16 h-16 rounded-2xl object-cover shadow-2xl group-hover:shadow-purple-500/30 transition-all duration-300"
                            onError={(e) => {
                              e.currentTarget.src = "/icon.png";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-white text-lg truncate group-hover:text-purple-300 transition-colors">
                            {app.name}
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-2 mt-1">
                            {app.description}
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
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
                          </div>
                          <span className="text-sm font-bold text-white">
                            {app.averageRating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400 font-medium">
                          {app.totalRatings} reviews
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProvideFeedback(app.appId);
                          }}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg py-2 text-xs font-medium shadow-lg border border-purple-400/30"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(app.miniappUrl, "_blank");
                          }}
                          className="px-3 py-2 bg-black/40 hover:bg-black/60 text-purple-300 rounded-lg transition-all duration-300 border border-purple-500/30"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      {context?.user?.fid && (
        <>
          <FloatingActionButton
            onClick={handleAddNewApp}
            buttonText="Add New"
            position="right"
          />
          <FloatingActionButton
            onClick={handleMyApps}
            buttonText="My Apps"
            position="left"
          />
        </>
      )}
    </div>
  );
}
