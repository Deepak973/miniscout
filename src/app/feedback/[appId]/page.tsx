"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Copy } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useMiniApp } from "@neynar/react";
import toast from "react-hot-toast";
import { useContract } from "~/hooks/useContract";
import { contractReads, App, Feedback } from "~/lib/contracts";
import { useConnect } from "wagmi";
import Header from "~/components/ui/Header";

export default function FeedbackPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { context: _context } = useMiniApp();
  const {
    isConnected,
    address,
    submitFeedback,
    isLoading: _isLoading,
  } = useContract();
  const { connect, connectors } = useConnect();
  const [app, setApp] = useState<(App & { averageRating: number }) | null>(
    null
  );
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [userFeedback, setUserFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [appId, setAppId] = useState<string>("");

  const copyFeedbackUrl = async () => {
    const feedbackUrl = window.location.href;
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

      await submitFeedback(BigInt(appIdNumber), rating, comment.trim());
      toast.success("Feedback submitted successfully!");
      fetchAppAndFeedbacks();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ecf87f]/20 to-[#81b622]/10">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#59981a] mx-auto mb-4"></div>
            <p className="text-[#3d550c]">Loading app details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ecf87f]/20 to-[#81b622]/10">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-[#81b622] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-[#3d550c] mb-2">
              App Not Found
            </h2>
            <p className="text-[#59981a]">
              The app you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecf87f]/20 to-[#81b622]/10">
      {/* Header */}
      <Header title="Feedback" showBackButton={true} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* App Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={app.iconUrl}
                alt={app.name}
                className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/icon.png";
                }}
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-[#3d550c]">
                  {app.name}
                </h2>
                <p className="text-[#59981a] text-sm">{app.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-[#ecf87f] fill-current" />
                    <span className="text-sm text-[#3d550c]">
                      {app.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-[#59981a]">
                    {app.totalRatings.toString()} reviews
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={copyFeedbackUrl}
            className="px-3 py-2 bg-[#81b622]/20 text-[#3d550c] hover:bg-[#81b622]/30"
            title="Copy feedback URL"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        {/* Feedback Form */}
        {isConnected ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-[#3d550c] mb-4">
              {userFeedback ? "Your Review" : "Write a Review"}
            </h3>

            {!userFeedback ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#3d550c] mb-2">
                    Your Rating
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-3xl transition-colors ${
                          star <= rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#3d550c] mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border border-[#81b622]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ecf87f]/20"
                    rows={4}
                    placeholder="Share your experience with this app..."
                  />
                </div>

                <Button
                  onClick={handleSubmitFeedback}
                  disabled={submitting || !comment.trim()}
                  className="bg-[#59981a] hover:bg-[#81b622] disabled:bg-gray-400 disabled:cursor-not-allowed text-white"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Number(userFeedback.rating)
                            ? "text-[#ecf87f] fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-[#59981a]">
                    {new Date(
                      Number(userFeedback.createdAt) * 1000
                    ).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[#3d550c]">{userFeedback.comment}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#ecf87f]/30 border border-[#81b622]/30 rounded-lg p-6 mb-8 text-center">
            <MessageSquare className="w-12 h-12 text-[#81b622] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#3d550c] mb-2">
              Connect to Review
            </h3>
            <p className="text-[#59981a] mb-4">
              Connect your wallet to see your earned rewards from reviewing
              apps.
            </p>
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-6 py-2 bg-[#59981a] text-white rounded-md hover:bg-[#81b622]"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* All Reviews */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-[#3d550c] mb-4">
            All Reviews ({feedbacks.length})
          </h3>

          {feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-[#81b622] mx-auto mb-4" />
              <p className="text-[#59981a]">
                No reviews yet. Be the first to review this app!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback, index) => (
                <div
                  key={`${feedback.feedbackId}-${index}`}
                  className="border border-[#ecf87f]/30 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#ecf87f]/20 flex items-center justify-center">
                      <span className="text-[#3d550c] text-sm font-medium">
                        {feedback.reviewer.slice(2, 6).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-[#3d550c] text-sm">
                          {feedback.reviewer.slice(0, 6)}...
                          {feedback.reviewer.slice(-4)}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= Number(feedback.rating)
                                  ? "text-[#ecf87f] fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[#3d550c] text-sm mb-2">
                        {feedback.comment}
                      </p>
                      <span className="text-xs text-[#59981a]">
                        {new Date(
                          Number(feedback.createdAt) * 1000
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
    </div>
  );
}
