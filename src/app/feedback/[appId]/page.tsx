"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Copy, Gift, Edit3 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useMiniApp } from "@neynar/react";
import toast from "react-hot-toast";
import { useContract } from "~/hooks/useContract";
import { contractReads, App, Feedback } from "~/lib/contracts";
import { NeynarUser } from "~/app/api/users/bulk/route";
import { useConnect } from "wagmi";
import Header from "~/components/ui/Header";
import { formatEther } from "viem";

export default function FeedbackPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { context } = useMiniApp();
  const {
    isConnected,
    address,
    submitFeedback,
    updateFeedback,
    isLoading: _isLoading,
  } = useContract();
  const [userFid, setUserFid] = useState<number | null>(null);
  const { connect, connectors } = useConnect();
  const [app, setApp] = useState<(App & { averageRating: number }) | null>(
    null
  );
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [userFeedback, setUserFeedback] = useState<Feedback | null>(null);
  const [userData, setUserData] = useState<Map<number, NeynarUser>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [appId, setAppId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  const copyFeedbackUrl = async () => {
    const feedbackUrl = `https://farcaster.xyz/miniapps/amt-aKG509bA/miniscout/feedback/${appId}`;
    try {
      await navigator.clipboard.writeText(feedbackUrl);
      toast.success("Feedback URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy URL:", error);
      toast.error("Failed to copy URL");
    }
  };

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setAppId(resolvedParams.appId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (context?.user?.fid) {
      setUserFid(context.user.fid);
    }
  }, [context]);

  const fetchAppAndFeedbacks = useCallback(async () => {
    if (!appId) return;

    setLoading(true);
    try {
      const appIdNumber = parseInt(appId);
      if (isNaN(appIdNumber)) {
        toast.error("Invalid app ID");
        return;
      }

      const appData = await contractReads.getApp(BigInt(appIdNumber));
      if (appData && appData.isActive) {
        setApp({
          ...appData,
          averageRating: appData.totalRatings > 0n ? 4.5 : 0,
        } as App & { averageRating: number });
      } else {
        toast.error("App not found");
        return;
      }

      const feedbacksData = await contractReads.getAppFeedbacks(
        BigInt(appIdNumber)
      );
      setFeedbacks(feedbacksData);

      // Fetch user data for all feedbacks
      if (feedbacksData.length > 0) {
        const fids = feedbacksData
          .map((f: Feedback) => Number(f.fid))
          .filter((fid) => fid > 0);
        if (fids.length > 0) {
          try {
            const fidsParam = fids.join(",");
            const response = await fetch(`/api/users/bulk?fids=${fidsParam}`);
            const data = await response.json();

            if (data.success && data.users) {
              const userMap = new Map<number, NeynarUser>();
              data.users.forEach((user: NeynarUser) =>
                userMap.set(user.fid, user)
              );
              setUserData(userMap);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        }
      }

      if (isConnected && address) {
        const hasGivenFeedback = await contractReads.hasUserGivenFeedback(
          BigInt(appIdNumber),
          address
        );
        if (hasGivenFeedback) {
          const userFeedbackData = feedbacksData.find(
            (f: Feedback) => f.reviewer.toLowerCase() === address.toLowerCase()
          );
          if (userFeedbackData) {
            setUserFeedback(userFeedbackData);
            setRating(Number(userFeedbackData.rating));
            setComment(userFeedbackData.comment);
          }
        }
      }
    } catch (_error) {
      console.error("Error fetching data:", _error);
      toast.error("Failed to load app data");
    } finally {
      setLoading(false);
    }
  }, [appId, isConnected, address]);

  useEffect(() => {
    if (appId) {
      fetchAppAndFeedbacks();
    }
  }, [appId, fetchAppAndFeedbacks]);

  // Real-time countdown for feedback update availability
  useEffect(() => {
    if (!userFeedback) return;

    const interval = setInterval(() => {
      // Force re-render to update countdown
      setFeedbacks([...feedbacks]);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [userFeedback, feedbacks]);

  const handleSubmitFeedback = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmitting(true);
    try {
      const appIdNumber = parseInt(appId);
      if (isNaN(appIdNumber)) {
        toast.error("Invalid app ID");
        return;
      }

      await submitFeedback(
        BigInt(appIdNumber),
        rating,
        comment.trim(),
        userFid || 0
      );
      toast.success("Feedback submitted successfully!");
      fetchAppAndFeedbacks();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFeedback = async () => {
    if (!isConnected || !address || !userFeedback) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!editComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setUpdating(true);
    try {
      await updateFeedback(
        userFeedback.feedbackId,
        editRating,
        editComment.trim()
      );
      toast.success("Feedback updated successfully!");
      setIsEditing(false);
      fetchAppAndFeedbacks();
    } catch (error: any) {
      toast.error(error.message || "Failed to update feedback");
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = () => {
    if (userFeedback) {
      setEditRating(Number(userFeedback.rating));
      setEditComment(userFeedback.comment);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditRating(5);
    setEditComment("");
  };

  const canUpdateFeedback = (feedback: Feedback) => {
    const feedbackTime = Number(feedback.createdAt) * 1000;
    const currentTime = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return currentTime >= feedbackTime + oneDayInMs;
  };

  const getTimeUntilUpdate = (feedback: Feedback) => {
    const feedbackTime = Number(feedback.createdAt) * 1000;
    const currentTime = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const timeRemaining = feedbackTime + oneDayInMs - currentTime;

    if (timeRemaining <= 0) return null;

    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor(
      (timeRemaining % (60 * 60 * 1000)) / (60 * 1000)
    );

    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0E0E]">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C9CDCF] mx-auto mb-4"></div>
            <p className="text-[#FAD691] arimo-400">Loading app details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-[#0F0E0E]">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-[#FAD691] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
              App Not Found
            </h2>
            <p className="text-[#C9CDCF] arimo-400">
              The app you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0E0E]">
      {/* Header */}
      <Header title="Feedback" showBackButton={true} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* App Info */}
        {/* App Info */}
        <div className="bg-[#ED775A]/10 rounded-lg shadow mb-8 border border-[#FAD691]/30 overflow-hidden">
          {/* Cover Image */}
          <div className="relative h-40">
            <img
              src={app.iconUrl} // 👈 can switch to app.coverImage if available
              alt={`${app.name} cover`}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/cover-fallback.png";
              }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0E]/80 to-transparent" />

            {/* Floating App Icon */}
            <div className="absolute left-6 -bottom-10">
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg border-2 border-[#FAD691]/50 bg-[#0F0E0E]">
                <img
                  src={app.iconUrl}
                  alt={app.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/icon.png";
                  }}
                />
              </div>
            </div>
            {/* Small Copy Button in top-right */}
            <div className="absolute top-3 right-3">
              <Button
                onClick={copyFeedbackUrl}
                className="p-2 bg-[#ED775A]/40 text-[#FAD691] hover:bg-[#ED775A]/60 rounded-md shadow"
                title="Copy feedback URL"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Info Content */}
          <div className="pt-14 px-6 pb-6">
            <h2 className="text-xl font-semibold text-[#FAD691] edu-nsw-act-cursive-600">
              {app.name}
            </h2>
            <p className="text-[#C9CDCF] text-sm arimo-400">
              {app.description}
            </p>

            {/* Stats */}
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-[#FAD691] fill-current" />
                <span className="text-sm text-[#FAD691] arimo-500">
                  {app.averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-[#C9CDCF] arimo-400">
                {app.totalRatings.toString()} reviews
              </span>
            </div>
            <div className="mt-4 bg-[#ED775A]/10 rounded-xl border border-[#FAD691]/30 px-4 py-3 shadow-sm">
              <h3 className="text-sm font-semibold text-[#FAD691] mb-2 flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#ED775A]" />
                Rewards
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-[#C9CDCF]">Per Review</div>
                <div className="text-right text-[#FAD691] font-medium">
                  {formatEther(app.rewardPerReview)} tokens
                </div>
                <div className="text-[#C9CDCF]">Available Pool</div>
                <div className="text-right text-[#FAD691] font-medium">
                  {formatEther(app.escrowAmount)} tokens
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        {isConnected ? (
          <div className="bg-[#ED775A]/10 rounded-lg shadow p-6 mb-8 border border-[#FAD691]/30">
            <h3 className="text-lg font-semibold text-[#FAD691] mb-4 edu-nsw-act-cursive-600">
              {userFeedback ? "Your Review" : "Write a Review"}
            </h3>

            {!userFeedback ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#FAD691] mb-2 arimo-600">
                    Your Rating
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-3xl transition-colors ${
                          star <= rating ? "text-[#FAD691]" : "text-gray-400"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#FAD691] mb-2 arimo-600">
                    Your Review
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border border-[#FAD691]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FAD691]/20"
                    rows={4}
                    placeholder="Share your experience with this app..."
                  />
                </div>

                <Button
                  onClick={handleSubmitFeedback}
                  disabled={submitting || !comment.trim()}
                  className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] disabled:bg-gray-400 disabled:cursor-not-allowed text-white arimo-600"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {!isEditing ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Number(userFeedback.rating)
                                  ? "text-[#FAD691] fill-current"
                                  : "text-gray-400"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-[#C9CDCF] arimo-400">
                          {new Date(
                            Number(userFeedback.createdAt) * 1000
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      {canUpdateFeedback(userFeedback) ? (
                        <Button
                          onClick={startEditing}
                          className="bg-[#FAD691]/20 text-[#FAD691] hover:bg-[#FAD691]/30 px-3 py-1 text-sm arimo-600 flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Review</span>
                        </Button>
                      ) : (
                        <div className="text-xs text-[#C9CDCF] arimo-400">
                          Can update in: {getTimeUntilUpdate(userFeedback)}
                        </div>
                      )}
                    </div>
                    <p className="text-[#C9CDCF] arimo-400">
                      {userFeedback.comment}
                    </p>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#FAD691] arimo-600">
                        Edit Your Review
                      </span>
                      <Button
                        onClick={cancelEditing}
                        className="bg-[#ED775A]/20 text-[#ED775A] hover:bg-[#ED775A]/30 px-3 py-1 text-sm arimo-600"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#FAD691] mb-2 arimo-600">
                        Your Rating
                      </label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setEditRating(star)}
                            className={`text-3xl transition-colors ${
                              star <= editRating
                                ? "text-[#FAD691]"
                                : "text-gray-400"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#FAD691] mb-2 arimo-600">
                        Your Review
                      </label>
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        className="w-full p-3 border border-[#FAD691]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FAD691]/20"
                        rows={4}
                        placeholder="Share your experience with this app..."
                      />
                    </div>

                    <Button
                      onClick={handleUpdateFeedback}
                      disabled={updating || !editComment.trim()}
                      className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] disabled:bg-gray-400 disabled:cursor-not-allowed text-white arimo-600"
                    >
                      {updating ? "Updating..." : "Update Review"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#ED775A]/20 border border-[#FAD691]/30 rounded-lg p-6 mb-8 text-center">
            <MessageSquare className="w-12 h-12 text-[#FAD691] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
              Connect to Review
            </h3>
            <p className="text-[#C9CDCF] mb-4 arimo-400">
              Connect your wallet to see your earned rewards from reviewing
              apps.
            </p>
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-6 py-2 bg-[#ED775A] text-white rounded-md hover:bg-[#FAD691] hover:text-[#0F0E0E] arimo-600"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* All Reviews */}
        <div className="bg-[#ED775A]/10 rounded-lg shadow p-6 border border-[#FAD691]/30">
          <h3 className="text-lg font-semibold text-[#FAD691] mb-4 edu-nsw-act-cursive-600">
            All Reviews ({feedbacks.length})
          </h3>

          {feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-[#FAD691] mx-auto mb-4" />
              <p className="text-[#C9CDCF] arimo-400">
                No reviews yet. Be the first to review this app!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback, index) => {
                const user = userData.get(Number(feedback.fid));
                return (
                  <div
                    key={`${feedback.feedbackId}-${index}`}
                    className="border border-[#FAD691]/30 rounded-lg p-4 bg-[#ED775A]/5"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#FAD691]/20 flex items-center justify-center overflow-hidden">
                        {user?.pfp_url ? (
                          <img
                            src={user.pfp_url}
                            alt={user.display_name || user.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                        ) : null}
                        <span
                          className={`text-[#FAD691] text-sm font-medium arimo-600 ${
                            user?.pfp_url ? "hidden" : ""
                          }`}
                        >
                          {user?.display_name?.slice(0, 2).toUpperCase() ||
                            user?.username?.slice(0, 2).toUpperCase() ||
                            feedback.reviewer.slice(2, 6).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-[#FAD691] text-sm arimo-600">
                            {user?.display_name ||
                              user?.username ||
                              `${feedback.reviewer.slice(
                                0,
                                6
                              )}...${feedback.reviewer.slice(-4)}`}
                          </h4>
                          {user && (
                            <span className="text-xs text-[#C9CDCF] bg-[#ED775A]/20 px-2 py-1 rounded-full arimo-400">
                              @{user.username}
                            </span>
                          )}
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= Number(feedback.rating)
                                    ? "text-[#FAD691] fill-current"
                                    : "text-gray-400"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-[#C9CDCF] text-sm mb-2 arimo-400">
                          {feedback.comment}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-[#C9CDCF] arimo-400">
                              {new Date(
                                Number(feedback.createdAt) * 1000
                              ).toLocaleDateString()}
                            </span>
                            {address &&
                              feedback.reviewer.toLowerCase() ===
                                address.toLowerCase() && (
                                <span className="text-xs text-[#FAD691] bg-[#FAD691]/20 px-2 py-1 rounded-full arimo-400">
                                  {canUpdateFeedback(feedback)
                                    ? "Can Update"
                                    : `Update in: ${getTimeUntilUpdate(
                                        feedback
                                      )}`}
                                </span>
                              )}
                          </div>
                          {user && (
                            <span className="text-xs text-[#C9CDCF] arimo-400">
                              FID: {user.fid}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
