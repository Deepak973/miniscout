"use client";

import { useState, useEffect } from "react";
import { Star, Search, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { MiniApp } from "~/lib/types";
import { useMiniApp } from "@neynar/react";
import { Navigation } from "~/components/ui/Navigation";
import toast from "react-hot-toast";

export default function FeedbacksPage() {
  const { context: _context } = useMiniApp();
  const [allApps, setAllApps] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState<MiniApp[]>([]);

  useEffect(() => {
    fetchAllApps();
  }, []);

  useEffect(() => {
    // Filter apps based on search term
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
      // Fetch all apps
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading all apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation title="All Apps" showBack={false} />

      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            MiniScout Apps
          </h1>
          <p className="text-gray-600 text-sm">
            Browse and provide feedback for all registered mini apps
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search mini apps by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredApps.length} apps for &quot;{searchTerm}&quot;
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-xl font-bold text-blue-600">
              {allApps.length}
            </div>
            <div className="text-xs text-gray-600">Total Apps</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-xl font-bold text-green-600">
              {allApps.reduce((sum, app) => sum + app.totalFeedback, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Reviews</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-xl font-bold text-yellow-600">
              {allApps.length > 0
                ? (
                    allApps.reduce((sum, app) => sum + app.averageRating, 0) /
                    allApps.length
                  ).toFixed(1)
                : "0.0"}
            </div>
            <div className="text-xs text-gray-600">Average Rating</div>
          </div>
        </div>

        {/* Apps List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Available Apps
            </h2>
          </div>

          {filteredApps.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {searchTerm
                  ? "No apps found for this search term."
                  : "No apps available yet."}
              </p>
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 rounded-xl"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app) => (
                <div
                  key={app.appId}
                  className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start space-x-4">
                    {/* App Icon */}
                    <div className="flex-shrink-0">
                      <img
                        src={app.iconUrl || "/icon.png"}
                        alt={app.name}
                        className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                        onError={(e) => {
                          e.currentTarget.src = "/icon.png";
                        }}
                      />
                    </div>

                    {/* App Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                        {app.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {app.description}
                      </p>

                      {/* Rating Info */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= app.averageRating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {app.averageRating.toFixed(1)} ({app.totalRatings}{" "}
                          reviews)
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleProvideFeedback(app.appId)}
                          className="flex-1 rounded-xl"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Provide Feedback
                        </Button>
                        <Button
                          onClick={() => window.open(app.homeUrl, "_blank")}
                          className="px-3 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-xl"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
