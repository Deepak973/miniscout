"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Search,
  MessageSquare,
  ExternalLink,
  Plus,
  Menu,
  X,
  Eye,
  Sparkles,
  Zap,
  Heart,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { MiniApp } from "~/lib/types";
import { useMiniApp } from "@neynar/react";
import toast from "react-hot-toast";

export default function HomePage() {
  const { context: _context } = useMiniApp();
  const [allApps, setAllApps] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState<MiniApp[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedbackDrawerOpen, setFeedbackDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<MiniApp | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [appReviews, setAppReviews] = useState<any[]>([]);

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
    } catch (_error) {
      console.error("Error fetching apps:", _error);
      toast.error("Failed to load apps data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReviews = async (app: MiniApp) => {
    setSelectedApp(app);
    setFeedbackDrawerOpen(true);
    setDrawerLoading(true);
    setAppReviews([]);

    try {
      const reviewsResponse = await fetch(`/api/feedback?appId=${app.appId}`);
      const reviewsData = await reviewsResponse.json();
      setAppReviews(reviewsData.feedback || []);
    } catch (_error) {
      console.error("Error fetching reviews:", _error);
      toast.error("Failed to load reviews");
    } finally {
      setTimeout(() => {
        setDrawerLoading(false);
      }, 1500);
    }
  };

  const handleAddNewApp = () => {
    window.location.href = "/add-app";
  };

  const handleMyApps = () => {
    window.location.href = "/my-apps";
  };

  const handleAppClick = (app: MiniApp) => {
    window.open(app.miniappUrl, "_blank");
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#B6B09F]/10 via-black to-[#EAE4D5]/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,242,242,0.1),transparent_50%)]"></div>
        <div className="flex items-center justify-center h-screen relative z-10">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-[#F2F2F2] mx-auto mb-6"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-[#F2F2F2] opacity-20"></div>
            </div>
            <p className="text-[#F2F2F2] text-lg font-medium roboto-mono-400">
              Loading amazing apps...
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

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#F2F2F2] rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#F2F2F2]/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-[#F2F2F2]/10 hover:bg-[#F2F2F2]/20 transition-all duration-300 border border-[#F2F2F2]/30"
            >
              <Menu className="w-5 h-5 text-[#F2F2F2]" />
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
                MiniScout
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddNewApp}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-black/50 backdrop-blur-xl rounded-xl p-4 border border-[#F2F2F2]/30 hover:border-[#F2F2F2]/50 transition-all duration-300">
            <div className="text-center">
              <div className="bg-[#F2F2F2]/20 p-2 rounded-full w-fit mx-auto mb-2">
                <Sparkles className="w-5 h-5 text-[#F2F2F2]" />
              </div>
              <div className="text-2xl font-bold text-[#F2F2F2] roboto-mono-400">
                {allApps.length}
              </div>
              <div className="text-xs text-[#B6B09F] roboto-mono-400">
                Total Apps
              </div>
            </div>
          </div>

          <div className="bg-black/50 backdrop-blur-xl rounded-xl p-4 border border-[#F2F2F2]/30 hover:border-[#F2F2F2]/50 transition-all duration-300">
            <div className="text-center">
              <div className="bg-[#F2F2F2]/20 p-2 rounded-full w-fit mx-auto mb-2">
                <MessageSquare className="w-5 h-5 text-[#F2F2F2]" />
              </div>
              <div className="text-2xl font-bold text-[#F2F2F2] roboto-mono-400">
                {getTotalReviews()}
              </div>
              <div className="text-xs text-[#B6B09F] roboto-mono-400">
                Reviews
              </div>
            </div>
          </div>

          <div className="bg-black/50 backdrop-blur-xl rounded-xl p-4 border border-[#F2F2F2]/30 hover:border-[#F2F2F2]/50 transition-all duration-300">
            <div className="text-center">
              <div className="bg-[#F2F2F2]/20 p-2 rounded-full w-fit mx-auto mb-2">
                <Star className="w-5 h-5 text-[#F2F2F2]" />
              </div>
              <div className="text-2xl font-bold text-[#F2F2F2] roboto-mono-400">
                {getAverageRating().toFixed(1)}
              </div>
              <div className="text-xs text-[#B6B09F] roboto-mono-400">
                Avg Rating
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="bg-black/50 backdrop-blur-xl rounded-xl border border-[#F2F2F2]/30 p-4 hover:border-[#F2F2F2]/50 transition-all duration-300">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#B6B09F] w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for mini apps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border-0 bg-transparent text-[#F2F2F2] focus:ring-0 focus:outline-none placeholder-[#B6B09F] roboto-mono-400"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-[#B6B09F] mt-2 ml-4 roboto-mono-400">
                Found {filteredApps.length} apps for "{searchTerm}"
              </p>
            )}
          </div>
        </div>

        {/* Apps Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#F2F2F2] roboto-mono-400">
              Featured Apps
            </h2>
            <div className="text-sm text-[#B6B09F] roboto-mono-400">
              {filteredApps.length} apps
            </div>
          </div>

          {filteredApps.length === 0 ? (
            <div className="bg-black/50 backdrop-blur-xl rounded-xl p-12 text-center border border-[#F2F2F2]/30">
              <div className="w-24 h-24 bg-[#F2F2F2]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#F2F2F2]/30">
                <MessageSquare className="w-12 h-12 text-[#B6B09F]" />
              </div>
              <h3 className="text-xl font-bold text-[#F2F2F2] mb-2 roboto-mono-400">
                No apps yet
              </h3>
              <p className="text-[#B6B09F] mb-6 roboto-mono-400">
                Be the first to add an amazing mini app!
              </p>
              <Button
                onClick={handleAddNewApp}
                className="bg-[#F2F2F2] hover:bg-[#F2F2F2]/80 rounded-lg px-6 py-2 text-sm font-medium text-black shadow-lg shadow-[#F2F2F2]/25 transition-all duration-300"
              >
                Add First App
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredApps.map((app) => (
                <div
                  key={app.appId}
                  className="bg-black/50 backdrop-blur-xl rounded-xl p-4 border border-[#F2F2F2]/30 hover:border-[#F2F2F2]/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleAppClick(app)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#F2F2F2] to-[#EAE4D5] rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewReviews(app);
                        }}
                        className="bg-[#F2F2F2]/20 hover:bg-[#F2F2F2]/30 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-[#F2F2F2] border border-[#F2F2F2]/30 flex-1 sm:flex-none transition-all duration-300"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(app.miniappUrl, "_blank");
                        }}
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

      {/* Sidebar Navigation */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 bg-black/90 backdrop-blur-xl border-r border-[#F2F2F2]/30">
            <div className="flex items-center justify-between p-4 border-b border-[#F2F2F2]/30">
              <h2 className="text-lg font-bold text-[#F2F2F2] roboto-mono-400">
                Menu
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg bg-[#F2F2F2]/10 hover:bg-[#F2F2F2]/20 transition-all duration-300 border border-[#F2F2F2]/30"
              >
                <X className="w-5 h-5 text-[#F2F2F2]" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Button
                  onClick={handleAddNewApp}
                  className="w-full bg-[#F2F2F2] hover:bg-[#F2F2F2]/80 rounded-lg px-4 py-3 text-black font-medium shadow-lg shadow-[#F2F2F2]/25 transition-all duration-300"
                >
                  Add New Mini App
                </Button>
                <Button
                  onClick={handleMyApps}
                  className="w-full bg-[#F2F2F2]/10 hover:bg-[#F2F2F2]/20 rounded-lg px-4 py-3 text-[#F2F2F2] font-medium border border-[#F2F2F2]/30 transition-all duration-300"
                >
                  My Mini Apps
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Drawer */}
      {feedbackDrawerOpen && selectedApp && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setFeedbackDrawerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl rounded-t-2xl border-t border-[#F2F2F2]/30 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#F2F2F2]/30">
              <h2 className="text-lg font-bold text-[#F2F2F2] roboto-mono-400">
                Reviews for {selectedApp.name}
              </h2>
              <button
                onClick={() => setFeedbackDrawerOpen(false)}
                className="p-2 rounded-lg bg-[#F2F2F2]/10 hover:bg-[#F2F2F2]/20 transition-all duration-300 border border-[#F2F2F2]/30"
              >
                <X className="w-5 h-5 text-[#F2F2F2]" />
              </button>
            </div>

            <div className="p-4">
              {drawerLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#F2F2F2] mx-auto"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-[#F2F2F2] opacity-20"></div>
                    </div>
                    <p className="text-[#F2F2F2] text-sm roboto-mono-400">
                      Loading reviews...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#F2F2F2] to-[#EAE4D5] rounded-lg blur opacity-20"></div>
                      <img
                        src={selectedApp.iconUrl}
                        alt={selectedApp.name}
                        className="w-16 h-16 rounded-lg object-cover relative z-10"
                        onError={(e) => {
                          e.currentTarget.src = "/icon.png";
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#F2F2F2] roboto-mono-400">
                        {selectedApp.name}
                      </h3>
                      <p className="text-[#B6B09F] text-sm roboto-mono-400">
                        {selectedApp.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-[#F2F2F2] fill-current" />
                          <span className="text-sm text-[#F2F2F2] roboto-mono-400">
                            {selectedApp.averageRating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-[#B6B09F] roboto-mono-400">
                          {selectedApp.totalRatings} reviews
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          (window.location.href = `/feedback/${selectedApp.appId}`)
                        }
                        className="bg-[#F2F2F2] hover:bg-[#F2F2F2]/80 rounded-lg px-4 py-2 text-sm font-medium text-black shadow-lg shadow-[#F2F2F2]/25 transition-all duration-300"
                      >
                        Write Review
                      </Button>
                      <h3 className="text-lg font-bold text-[#F2F2F2] whitespace-nowrap roboto-mono-400">
                        All Reviews ({appReviews.length})
                      </h3>
                    </div>

                    {appReviews.length === 0 ? (
                      <div className="bg-black/50 backdrop-blur-xl rounded-xl p-6 text-center border border-[#F2F2F2]/30">
                        <MessageSquare className="w-12 h-12 text-[#B6B09F] mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-[#F2F2F2] mb-2 roboto-mono-400">
                          No reviews yet
                        </h3>
                        <p className="text-[#B6B09F] mb-4 roboto-mono-400">
                          Be the first to review this app!
                        </p>
                        <Button
                          onClick={() =>
                            (window.location.href = `/feedback/${selectedApp.appId}`)
                          }
                          className="bg-[#F2F2F2] hover:bg-[#F2F2F2]/80 rounded-lg px-6 py-2 text-sm font-medium text-black shadow-lg shadow-[#F2F2F2]/25 transition-all duration-300"
                        >
                          Write First Review
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {appReviews.map((review) => (
                          <div
                            key={
                              review._id ||
                              `${review.appId}-${review.userFid}-${review.createdAt}`
                            }
                            className="bg-black/50 backdrop-blur-xl rounded-xl p-4 border border-[#F2F2F2]/30"
                          >
                            <div className="flex items-start space-x-3">
                              <img
                                src={review.userPfpUrl || "/icon.png"}
                                alt={review.userDisplayName || review.userName}
                                className="w-10 h-10 rounded-full object-cover border border-[#F2F2F2]/30"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-bold text-[#F2F2F2] text-sm roboto-mono-400">
                                    {review.userDisplayName || review.userName}
                                  </h4>
                                  <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3 h-3 ${
                                          star <= review.rating
                                            ? "text-yellow-400 fill-current"
                                            : "text-[#B6B09F]"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-[#EAE4D5] text-sm mb-2 roboto-mono-400">
                                  {review.comment}
                                </p>
                                <span className="text-xs text-[#B6B09F] roboto-mono-400">
                                  {new Date(
                                    review.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
