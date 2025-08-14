"use client";

import { MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/Button";

export function FeedbacksTab() {
  const handleViewAllFeedback = () => {
    window.location.href = "/feedbacks";
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)] px-6">
      <div className="text-center w-full max-w-md mx-auto space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <MessageSquare className="w-16 h-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">All Apps</h2>
          <p className="text-gray-600">
            Browse and search through all registered mini apps. Click on any app
            to provide feedback and see existing reviews.
          </p>
        </div>

        <div className="space-y-4">
          <Button onClick={handleViewAllFeedback} className="w-full">
            <ExternalLink className="w-4 h-4 mr-2" />
            Browse All Apps
          </Button>

          <div className="text-sm text-gray-500">
            Opens in the same window for seamless navigation
          </div>
        </div>
      </div>
    </div>
  );
}
