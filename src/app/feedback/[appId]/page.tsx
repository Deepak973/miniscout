"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Edit, Home } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { MiniApp, Feedback } from "~/lib/types";
import { useMiniApp } from "@neynar/react";
import toast from "react-hot-toast";

export default function FeedbackPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { context } = useMiniApp();
  const [app, setApp] = useState<MiniApp | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [userFeedback, setUserFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [appId, setAppId] = useState<string>("");

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setAppId(resolvedParams.appId);
    };
    resolveParams();
  }, [params]);

  const fetchAppAndFeedbacks = useCallback(async () => {
    if (!appId) return;

    setLoading(true);
    try {
      // Fetch app details
      const appResponse = await fetch(`/api/apps?appId=${appId}`);
      const appData = await appResponse.json();

      if (appData.apps && appData.apps.length > 0) {
        setApp(appData.apps[0]);
      } else {
        console.error("App not found for appId:", appId);
        toast.error("App not found");
        return;
      }

      // Fetch feedbacks
      const feedbackResponse = await fetch(`/api/feedback?appId=${appId}`);
      const feedbackData = await feedbackResponse.json();
      setFeedbacks(feedbackData.feedback || []);

      // Check if user has already submitted feedback
      if (context?.user?.fid) {
        const userFeedback = feedbackData.feedback?.find(
          (f: Feedback) => f.userFid === context.user.fid
        );
        if (userFeedback) {
          setUserFeedback(userFeedback);
          setRating(userFeedback.rating);
          setComment(userFeedback.comment);
        }
      }
    } catch (_error) {
      console.error("Error fetching data:", _error);
      toast.error("Failed to load app data");
    } finally {
      setLoading(false);
    }
  }, [appId, context?.user?.fid]);

  useEffect(() => {
    if (appId) {
      fetchAppAndFeedbacks();
    }
  }, [appId, fetchAppAndFeedbacks]);

  const handleSubmitFeedback = async () => {
    if (!context?.user?.fid) {
      toast.error("Please connect your Farcaster account");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appId,
          rating,
          comment: comment.trim(),
          userFid: context.user.fid,
          userName: context.user.username,
          userDisplayName: context.user.displayName,
          userPfpUrl: context.user.pfpUrl,
        }),
      });

      if (response.ok) {
        toast.success("Feedback submitted successfully!");
        setEditing(false);
        fetchAppAndFeedbacks(); // Refresh data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to submit feedback");
      }
    } catch (_error) {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFeedback = async () => {
    if (!userFeedback?._id) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appId,
          feedbackId: userFeedback._id,
          rating,
          comment: comment.trim(),
          userFid: context?.user?.fid,
          userName: context?.user?.username,
          userDisplayName: context?.user?.displayName,
          userPfpUrl: context?.user?.pfpUrl,
        }),
      });

      if (response.ok) {
        toast.success("Feedback updated successfully!");
        setEditing(false);
        fetchAppAndFeedbacks(); // Refresh data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update feedback");
      }
    } catch (_error) {
      toast.error("Failed to update feedback");
    } finally {
      setSubmitting(false);
    }
  };

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
              Loading app details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#B6B09F]/10 via-black to-[#EAE4D5]/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,242,242,0.1),transparent_50%)]"></div>

        <div className="flex items-center justify-center h-screen relative z-10">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-[#B6B09F] mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-[#F2F2F2] mb-2 roboto-mono-400">
              App Not Found
            </h2>
            <p className="text-[#B6B09F] roboto-mono-400">
              The app you&apos;re looking for doesn&apos;t exist.
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
                Feedback
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => (window.location.href = "/")}
              className="p-2 rounded-lg bg-[#F2F2F2] hover:bg-[#F2F2F2]/80 transition-all duration-300 shadow-lg shadow-[#F2F2F2]/25 text-black"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 relative z-10">
        {/* App Info */}
        <div className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-[#F2F2F2]/30">
          <div className="flex items-center space-x-4">
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
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#F2F2F2] roboto-mono-400">
                {app.name}
              </h2>
              <p className="text-[#B6B09F] text-sm roboto-mono-400">
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
          </div>
        </div>

        {/* Feedback Form */}
        {context?.user?.fid ? (
          <div className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-[#F2F2F2]/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#F2F2F2] roboto-mono-400">
                {userFeedback && !editing
                  ? "Your Review"
                  : editing
                  ? "Edit Your Review"
                  : "Write a Review"}
              </h3>
              {userFeedback && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 rounded-lg bg-[#F2F2F2]/10 hover:bg-[#F2F2F2]/20 transition-all duration-300 border border-[#F2F2F2]/30"
                >
                  <Edit className="w-4 h-4 text-[#F2F2F2]" />
                </button>
              )}
            </div>

            {(!userFeedback || editing) && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#F2F2F2] mb-2 roboto-mono-400">
                    Your Rating
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-colors ${
                          star <= rating ? "text-yellow-400" : "text-[#B6B09F]"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F2F2F2] mb-2 roboto-mono-400">
                    Your Review
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 bg-black/50 border border-[#F2F2F2]/30 rounded-lg text-[#F2F2F2] placeholder-[#B6B09F] focus:outline-none focus:border-[#F2F2F2] roboto-mono-400"
                    rows={4}
                    placeholder="Share your experience with this app..."
                  />
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={
                      userFeedback ? handleUpdateFeedback : handleSubmitFeedback
                    }
                    disabled={submitting || !comment.trim()}
                    className="bg-[#F2F2F2] hover:bg-[#F2F2F2]/80 disabled:bg-[#B6B09F] disabled:cursor-not-allowed rounded-lg px-6 py-2 text-sm font-medium text-black shadow-lg shadow-[#F2F2F2]/25 transition-all duration-300"
                  >
                    {submitting
                      ? "Submitting..."
                      : userFeedback
                      ? "Update Review"
                      : "Submit Review"}
                  </Button>
                  {editing && (
                    <Button
                      onClick={() => {
                        setEditing(false);
                        setRating(userFeedback?.rating || 5);
                        setComment(userFeedback?.comment || "");
                      }}
                      className="bg-[#F2F2F2]/10 hover:bg-[#F2F2F2]/20 rounded-lg px-6 py-2 text-sm font-medium text-[#F2F2F2] border border-[#F2F2F2]/30 transition-all duration-300"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}

            {userFeedback && !editing && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= userFeedback.rating
                            ? "text-yellow-400 fill-current"
                            : "text-[#B6B09F]"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-[#B6B09F] roboto-mono-400">
                    {new Date(userFeedback.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[#EAE4D5] text-sm roboto-mono-400">
                  {userFeedback.comment}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-black/50 backdrop-blur-xl rounded-xl p-6 text-center border border-[#F2F2F2]/30">
            <MessageSquare className="w-12 h-12 text-[#B6B09F] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#F2F2F2] mb-2 roboto-mono-400">
              Connect to Review
            </h3>
            <p className="text-[#B6B09F] roboto-mono-400">
              Please connect your Farcaster account to write a review.
            </p>
          </div>
        )}

        {/* All Reviews */}
        <div className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-[#F2F2F2]/30">
          <h3 className="text-lg font-bold text-[#F2F2F2] mb-4 roboto-mono-400">
            All Reviews ({feedbacks.length})
          </h3>

          {feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-[#B6B09F] mx-auto mb-4" />
              <p className="text-[#B6B09F] roboto-mono-400">
                No reviews yet. Be the first to review this app!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback._id}
                  className="bg-black/30 backdrop-blur-xl rounded-lg p-4 border border-[#F2F2F2]/20"
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={feedback.userPfpUrl || "/icon.png"}
                      alt={feedback.userDisplayName || feedback.userName}
                      className="w-10 h-10 rounded-full object-cover border border-[#F2F2F2]/30"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-bold text-[#F2F2F2] text-sm roboto-mono-400">
                          {feedback.userDisplayName || feedback.userName}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= feedback.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-[#B6B09F]"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[#EAE4D5] text-sm mb-2 roboto-mono-400">
                        {feedback.comment}
                      </p>
                      <span className="text-xs text-[#B6B09F] roboto-mono-400">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
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
