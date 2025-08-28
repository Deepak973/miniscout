"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Copy, Gift, Edit3, X } from "lucide-react";
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTokenChart, setShowTokenChart] = useState(false);

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

      // Show celebration animation
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);

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

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <div className="text-2xl font-bold text-[#FAD691] libertinus-keyboard-regular animate-pulse">
                Review Submitted!
              </div>
              <div className="text-lg text-[#C9CDCF] arimo-400 mt-2">
                Thanks for your feedback! ✨
              </div>
            </div>
          </div>

          {/* Floating Confetti */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#FAD691] rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}

          {/* Sparkles */}
          {[...Array(15)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute text-[#FAD691] animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
                fontSize: `${12 + Math.random() * 8}px`,
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      {/* Token Chart Modal */}
      {showTokenChart && app && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowTokenChart(false)}
          />

          {/* Modal */}
          <div className="relative bg-[#0F0E0E] rounded-2xl border border-[#FAD691]/30 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#FAD691]/20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden">
                  <img
                    src={app.iconUrl}
                    alt={app.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/icon.png";
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#FAD691] ">
                    {app.name}
                  </h3>
                  <p className="text-sm text-[#C9CDCF] arimo-400">
                    {app.appToken.slice(0, 6)}...{app.appToken.slice(-4)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTokenChart(false)}
                className="!p-0 !m-0 w-5 h-5 flex items-center justify-center 
             bg-[#ED775A]/20 text-[#FAD691] hover:bg-[#ED775A]/40 
             rounded-lg transition-all duration-200 hover:scale-105"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chart Content */}
            <div className="p-6">
              <div
                style={{ position: "relative", width: "100%", height: "400px" }}
              >
                <iframe
                  id="geckoterminal-embed"
                  title="GeckoTerminal Embed"
                  src={`https://www.geckoterminal.com/base/pools/${app.appToken}?embed=1&info=0&swaps=0&light_chart=0&chart_type=market_cap&resolution=1d&bg_color=111827`}
                  frameBorder="0"
                  allow="clipboard-write"
                  allowFullScreen
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "12px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* Token Address Section */}
            <div className="mt-4 bg-[#FAD691]/10 rounded-xl border border-[#FAD691]/30 px-4 py-3 shadow-sm">
              <h3 className="text-sm font-semibold text-[#FAD691] mb-2 flex items-center gap-2">
                <span className="text-[#ED775A]">🔗</span>
                Token Contract
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[#C9CDCF] arimo-400">
                    Address:
                  </span>
                  <button
                    onClick={() => setShowTokenChart(true)}
                    className="text-sm text-[#FAD691] font-mono arimo-600 hover:text-[#ED775A] transition-colors duration-200 cursor-pointer hover:underline"
                    title="Click to view token chart"
                  >
                    {app.appToken.slice(0, 6)}...{app.appToken.slice(-4)}
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(app.appToken);
                      toast.success("Token address copied to clipboard!");
                    }}
                    className="p-1.5 bg-[#ED775A]/20 text-[#FAD691] hover:bg-[#ED775A]/40 rounded-md transition-all duration-200 hover:scale-105"
                    title="Copy token address"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Form */}
        {isConnected ? (
          <div className="bg-[#ED775A]/10 rounded-lg shadow p-6 mb-8 border border-[#FAD691]/30">
            <h3 className="text-lg font-semibold text-[#FAD691] mb-4 libertinus-keyboard-regular">
              {userFeedback ? "Your Review" : "Write a Review"}
            </h3>

            {!userFeedback ? (
              <div className="space-y-6">
                {/* Animated Rating Section */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#FAD691] mb-4 arimo-600 text-center">
                    Rate Your Experience
                  </label>

                  {/* Rating Container with Floating Animation */}
                  <div className="relative bg-gradient-to-br from-[#1C1B1B]/80 to-[#2A2A2A]/60 rounded-2xl p-8 border border-[#FAD691]/20 shadow-2xl overflow-hidden">
                    {/* Animated Background Particles */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-[#FAD691]/20 rounded-full animate-pulse"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.5}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Interactive Star Rating */}
                    <div className="flex justify-center items-center space-x-4 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`relative group transition-all duration-500 transform hover:scale-125 ${
                            star <= rating
                              ? "animate-bounce"
                              : "hover:animate-pulse"
                          }`}
                        >
                          {/* Star Background Glow */}
                          <div
                            className={`absolute inset-0 rounded-full transition-all duration-300 ${
                              star <= rating
                                ? "bg-[#FAD691]/30 animate-ping"
                                : "bg-transparent"
                            }`}
                          />

                          {/* Main Star */}
                          <div
                            className={`relative text-5xl transition-all duration-300 transform ${
                              star <= rating
                                ? "text-[#FAD691] scale-110 drop-shadow-lg"
                                : "text-gray-500 hover:text-[#FAD691]/60"
                            }`}
                          >
                            ★
                          </div>

                          {/* Hover Effect */}
                          <div className="absolute -inset-2 bg-gradient-to-r from-[#FAD691]/20 to-[#ED775A]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                        </button>
                      ))}
                    </div>

                    {/* Rating Description */}
                    <div className="text-center">
                      <div className="text-lg font-semibold text-[#FAD691] mb-2 libertinus-keyboard-regular transition-all duration-500">
                        {rating === 1 && "Poor Experience"}
                        {rating === 2 && "Below Average"}
                        {rating === 3 && "Average"}
                        {rating === 4 && "Good Experience"}
                        {rating === 5 && "Excellent!"}
                      </div>
                      <div className="text-sm text-[#C9CDCF] arimo-400">
                        {rating === 1 &&
                          "This app needs significant improvements"}
                        {rating === 2 && "There's room for improvement"}
                        {rating === 3 && "It's okay, but could be better"}
                        {rating === 4 && "This is a solid app"}
                        {rating === 5 && "This app exceeded all expectations!"}
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="mt-6 bg-[#1C1B1B]/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#ED775A] to-[#FAD691] h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(rating / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Animated Review Section */}
                <div className="relative">
                  <label className="block text-sm font-medium text-[#FAD691] mb-3 arimo-600">
                    Share Your Experience
                  </label>

                  {/* Enhanced Textarea Container */}
                  <div className="relative group">
                    {/* Floating Label Animation */}
                    <div className="absolute -top-3 left-3 px-2 bg-[#0F0E0E] text-xs text-[#FAD691] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 z-10 border border-[#FAD691]/20 rounded">
                      Your thoughts matter! 💭
                    </div>

                    {/* Animated Border */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#FAD691]/20 via-[#ED775A]/20 to-[#FAD691]/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="relative w-full p-4 border-2 border-[#FAD691]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FAD691]/40 bg-[#1C1B1B]/50 text-[#FAD691] placeholder-[#C9CDCF]/50 transition-all duration-300 group-focus-within:border-[#FAD691]/60 group-focus-within:bg-[#1C1B1B]/70 resize-none"
                      rows={4}
                      placeholder="Share your experience with this app... ✨"
                    />

                    {/* Character Counter with Animation */}
                    <div className="absolute bottom-2 right-3 text-xs text-[#C9CDCF]/60 transition-all duration-300 z-10">
                      {comment.length}/500
                    </div>

                    {/* Success Indicator */}
                    {comment.length > 50 && (
                      <div className="absolute top-2 right-2 text-[#FAD691] animate-pulse z-10">
                        ✨
                      </div>
                    )}
                  </div>
                </div>

                {/* Animated Submit Button */}
                <div className="relative group">
                  {/* Button Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ED775A] to-[#FAD691] rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-lg" />

                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={submitting || !comment.trim() || rating === 0}
                    className="relative w-full bg-gradient-to-r from-[#ED775A] to-[#FAD691] hover:from-[#FAD691] hover:to-[#ED775A] disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white arimo-600 font-semibold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-[#FAD691]/30"
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        <span>Submitting Review...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Submit Review</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-6 bg-gradient-to-br from-[#1C1B1B]/70 to-[#2A2A2A]/60 rounded-2xl shadow-lg border border-[#FAD691]/20">
                {!isEditing ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Animated Star Rating */}
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 transition-transform duration-300 hover:scale-125 ${
                                star <= Number(userFeedback.rating)
                                  ? "text-[#FAD691] fill-current"
                                  : "text-gray-500"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-[#C9CDCF] arimo-400">
                          {new Date(
                            Number(userFeedback.createdAt) * 1000
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      {canUpdateFeedback(userFeedback) ? (
                        <Button
                          onClick={startEditing}
                          className="bg-[#FAD691]/20 text-[#FAD691] hover:bg-[#FAD691]/30 px-3 py-1 text-sm arimo-600 flex items-center space-x-1 transition hover:scale-105"
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
                    <p className="text-[#C9CDCF] arimo-400 text-sm p-2 bg-[#FAD691]/5 rounded-md shadow-inner">
                      {userFeedback.comment}
                    </p>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#FAD691] arimo-600">
                        Edit Your Review
                      </span>
                      <Button
                        onClick={cancelEditing}
                        className="bg-[#ED775A]/20 text-[#ED775A] hover:bg-[#ED775A]/30 px-3 py-1 text-sm arimo-600 transition hover:scale-105"
                      >
                        Cancel
                      </Button>
                    </div>

                    {/* Enhanced Edit Rating Section */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-[#FAD691] mb-3 arimo-600">
                        Update Your Rating
                      </label>

                      {/* Rating Container */}
                      <div className="relative bg-gradient-to-br from-[#1C1B1B]/60 to-[#2A2A2A]/40 rounded-xl p-6 border border-[#FAD691]/20">
                        {/* Interactive Star Rating */}
                        <div className="flex justify-center items-center space-x-3 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setEditRating(star)}
                              className={`relative group transition-all duration-500 transform hover:scale-125 ${
                                star <= editRating
                                  ? "animate-bounce"
                                  : "hover:animate-pulse"
                              }`}
                            >
                              {/* Star Background Glow */}
                              <div
                                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                                  star <= editRating
                                    ? "bg-[#FAD691]/30 animate-ping"
                                    : "bg-transparent"
                                }`}
                              />

                              {/* Main Star */}
                              <div
                                className={`relative text-4xl transition-all duration-300 transform ${
                                  star <= editRating
                                    ? "text-[#FAD691] scale-110 drop-shadow-lg"
                                    : "text-gray-500 hover:text-[#FAD691]/60"
                                }`}
                              >
                                ★
                              </div>

                              {/* Hover Effect */}
                              <div className="absolute -inset-2 bg-gradient-to-r from-[#FAD691]/20 to-[#ED775A]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                            </button>
                          ))}
                        </div>

                        {/* Rating Description */}
                        <div className="text-center">
                          <div className="text-sm font-semibold text-[#FAD691] mb-1 libertinus-keyboard-regular transition-all duration-500">
                            {editRating === 1 && "Poor Experience"}
                            {editRating === 2 && "Below Average"}
                            {editRating === 3 && "Average"}
                            {editRating === 4 && "Good Experience"}
                            {editRating === 5 && "Excellent!"}
                          </div>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="mt-4 bg-[#1C1B1B]/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#ED775A] to-[#FAD691] h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(editRating / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Edit Review Section */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-[#FAD691] mb-3 arimo-600">
                        Update Your Experience
                      </label>

                      {/* Enhanced Textarea Container */}
                      <div className="relative group">
                        {/* Floating Label Animation */}
                        <div className="absolute -top-3 left-3 px-2 bg-[#0F0E0E] text-xs text-[#FAD691] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 z-10 border border-[#FAD691]/20 rounded">
                          Update your thoughts! ✏️
                        </div>

                        {/* Animated Border */}
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#FAD691]/20 via-[#ED775A]/20 to-[#FAD691]/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="relative w-full p-4 border-2 border-[#FAD691]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FAD691]/40 bg-[#1C1B1B]/50 text-[#FAD691] placeholder-[#C9CDCF]/50 transition-all duration-300 group-focus-within:border-[#FAD691]/60 group-focus-within:bg-[#1C1B1B]/70 resize-none"
                          rows={4}
                          placeholder="Update your experience with this app... ✨"
                        />

                        {/* Character Counter with Animation */}
                        <div className="absolute bottom-2 right-3 text-xs text-[#C9CDCF]/60 transition-all duration-300 z-10">
                          {editComment.length}/500
                        </div>

                        {/* Success Indicator */}
                        {editComment.length > 50 && (
                          <div className="absolute top-2 right-2 text-[#FAD691] animate-pulse z-10">
                            ✨
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Animated Update Button */}
                    <div className="relative group">
                      {/* Button Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ED775A] to-[#FAD691] rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-lg" />

                      <Button
                        onClick={handleUpdateFeedback}
                        disabled={updating || !editComment.trim()}
                        className="relative w-full bg-gradient-to-r from-[#ED775A] to-[#FAD691] hover:from-[#FAD691] hover:to-[#ED775A] disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white arimo-600 font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-[#FAD691]/30"
                      >
                        {updating ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            <span>Updating Review...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>Update Review</span>
                            <span className="text-lg">✨</span>
                          </div>
                        )}
                      </Button>

                      {/* Success Animation Trigger */}
                      {editComment.length > 20 && (
                        <div className="absolute -top-2 -right-2 w-3 h-3 bg-[#FAD691] rounded-full animate-ping" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#ED775A]/20 border border-[#FAD691]/30 rounded-lg p-6 mb-8 text-center">
            <MessageSquare className="w-12 h-12 text-[#FAD691] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#FAD691] mb-2 libertinus-keyboard-regular">
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
          <h3 className="text-lg font-semibold text-[#FAD691] mb-4 ">
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
