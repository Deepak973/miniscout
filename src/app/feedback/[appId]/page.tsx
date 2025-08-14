"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Star, Send, MessageSquare, Edit, X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useMiniApp } from "@neynar/react";
import { Navigation } from "~/components/ui/Navigation";

import { Label } from "~/components/ui/label";
import { MiniApp, Feedback } from "~/lib/types";
import toast from "react-hot-toast";

export default function FeedbackPage() {
  const params = useParams();
  const appId = params.appId as string;
  const { context } = useMiniApp();

  const [app, setApp] = useState<MiniApp | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(
    null
  );
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [userFeedback, setUserFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (appId) {
      fetchApp();
      fetchFeedback();
    }
  }, [appId]);

  const fetchApp = async () => {
    try {
      const response = await fetch(`/api/apps?appId=${appId}`);
      const data = await response.json();
      if (data.apps && data.apps.length > 0) {
        setApp(data.apps[0]);
      }
    } catch (error) {
      console.error("Error fetching app:", error);
      toast.error("Failed to load app details");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await fetch(`/api/feedback?appId=${appId}`);
      const data = await response.json();
      setFeedback(data.feedback || []);

      // Find user's existing feedback
      if (context?.user?.fid) {
        const userExistingFeedback = data.feedback?.find(
          (f: Feedback) => f.userFid === context.user.fid
        );
        setUserFeedback(userExistingFeedback || null);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!context?.user?.fid) {
      toast.error("Please connect your Farcaster account to provide feedback");
      return;
    }

    if (userFeedback) {
      toast.error(
        "You have already provided feedback for this app. You can edit your existing feedback."
      );
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
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
          comment,
          userFid: context.user.fid,
          userName: context.user.username,
          userDisplayName: context.user.displayName,
          userPfpUrl: context.user.pfpUrl,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Feedback submitted successfully!");
        setRating(0);
        setComment("");
        fetchFeedback();
        fetchApp(); // Refresh app stats
      } else {
        toast.error(data.error || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFeedback = (feedbackItem: Feedback) => {
    setEditingFeedbackId(feedbackItem._id || null);
    setEditRating(feedbackItem.rating);
    setEditComment(feedbackItem.comment);
  };

  const handleCancelEdit = () => {
    setEditingFeedbackId(null);
    setEditRating(0);
    setEditComment("");
  };

  const handleUpdateFeedback = async () => {
    if (editRating === 0) {
      toast.error("Please select a rating");
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
          rating: editRating,
          comment: editComment,
          userFid: context?.user?.fid,
          userName: context?.user?.username,
          userDisplayName: context?.user?.displayName,
          userPfpUrl: context?.user?.pfpUrl,
          feedbackId: editingFeedbackId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Feedback updated successfully!");
        handleCancelEdit();
        fetchFeedback();
        fetchApp(); // Refresh app stats
      } else {
        toast.error(data.error || "Failed to update feedback");
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast.error("Failed to update feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">App not found</p>
          <p className="text-sm text-gray-500 mt-2">
            The app you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>

      <div className="relative z-10">
        <Navigation title={app.name} />

        <div className="px-4 py-6 space-y-6">
          {/* App Header Card */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 p-6">
            <div className="flex items-center space-x-4">
              <img
                src={app.iconUrl}
                alt={app.name}
                className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                onError={(e) => {
                  e.currentTarget.src = "/icon.png";
                }}
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black text-white truncate">
                  {app.name}
                </h1>
                <p className="text-white text-sm mt-1 line-clamp-2">
                  {app.description}
                </p>
                <div className="flex items-center space-x-2 mt-3">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-bold text-white">
                      {app.averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-white">
                      ({app.totalRatings} ratings)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User's Feedback Section */}
          {!context?.user?.fid ? (
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 p-6">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h2 className="text-lg font-bold mb-2 text-white">
                  Connect to Provide Feedback
                </h2>
                <p className="text-white text-sm">
                  Please connect your Farcaster account to provide feedback for
                  this app.
                </p>
              </div>
            </div>
          ) : userFeedback ? (
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 p-6">
              <h2 className="text-lg font-bold mb-4 text-white">
                Your Feedback
              </h2>

              {editingFeedbackId === userFeedback._id ? (
                // Edit mode
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {userFeedback.userPfpUrl && (
                      <img
                        src={userFeedback.userPfpUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-white">
                          {userFeedback.userDisplayName ||
                            userFeedback.userName ||
                            "You"}
                        </span>
                        {userFeedback.userName && (
                          <span className="text-xs text-purple-300">
                            @{userFeedback.userName}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleCancelEdit}
                      className="text-purple-300 hover:text-purple-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2 text-white">
                      Rating
                    </Label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setEditRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= editRating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-600"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2 text-white">
                      Comment
                    </Label>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-black/40 text-white placeholder-gray-400"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleUpdateFeedback}
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? "Updating..." : "Update Feedback"}
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-purple-500/30 bg-black/40 text-purple-300 hover:bg-black/60"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {userFeedback.userPfpUrl && (
                        <img
                          src={userFeedback.userPfpUrl}
                          alt="Profile"
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm text-white">
                            {userFeedback.userDisplayName ||
                              userFeedback.userName ||
                              "You"}
                          </span>
                          {userFeedback.userName && (
                            <span className="text-xs text-purple-300">
                              @{userFeedback.userName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= userFeedback.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-purple-300">
                            {new Date(
                              userFeedback.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEditFeedback(userFeedback)}
                      className="text-purple-300 hover:text-purple-400 p-1"
                      title="Edit feedback"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  {userFeedback.comment && (
                    <p className="text-white text-sm">{userFeedback.comment}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 p-6">
              <h2 className="text-lg font-bold mb-4 text-white">
                Rate this app
              </h2>

              {/* Rating Stars */}
              <div className="mb-6">
                <Label className="block text-sm font-medium mb-3 text-white">
                  Your Rating
                </Label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <Label
                  htmlFor="comment"
                  className="block text-sm font-medium mb-3 text-white"
                >
                  Your Review (Optional)
                </Label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this app..."
                  className="w-full px-4 py-3 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-black/40 text-white placeholder-gray-400"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSubmitFeedback}
                disabled={submitting || rating === 0}
                className="w-full py-3 rounded-xl font-medium"
              >
                {submitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Submit Feedback</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* Feedback List */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Recent Reviews</h2>
            </div>

            {feedback.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-white text-sm">
                  No reviews yet. Be the first to review!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div
                    key={item._id}
                    className="border-b border-purple-500/20 pb-4 last:border-b-0"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {item.userPfpUrl && (
                            <img
                              src={item.userPfpUrl}
                              alt="Profile"
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm text-white">
                                {item.userDisplayName ||
                                  item.userName ||
                                  "Anonymous"}
                              </span>
                              {item.userName && (
                                <span className="text-xs text-purple-300">
                                  @{item.userName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= item.rating
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-600"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-purple-300">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {item.comment && (
                        <p className="text-white text-sm">{item.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
