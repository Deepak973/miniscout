import { NextRequest, NextResponse } from "next/server";
import { getDb } from "~/lib/mongodb";
import { Feedback, FeedbackData } from "~/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      appId,
      rating,
      comment,
      userFid,
      userName,
      userDisplayName,
      userPfpUrl,
      feedbackId,
    } = body as FeedbackData & {
      appId: string;
      userFid?: number;
      userName?: string;
      userDisplayName?: string;
      userPfpUrl?: string;
      feedbackId?: string;
    };

    if (!appId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Invalid appId or rating" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const feedbackCollection = db.collection("feedback");
    const appsCollection = db.collection("apps");

    // Check if app exists
    const app = await appsCollection.findOne({ appId });
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Check if this is an edit (feedbackId provided) or new feedback
    if (feedbackId) {
      // Update existing feedback
      const { ObjectId } = await import("mongodb");
      const existingFeedback = await feedbackCollection.findOne({
        _id: new ObjectId(feedbackId),
      });

      if (!existingFeedback) {
        return NextResponse.json(
          { error: "Feedback not found" },
          { status: 404 }
        );
      }

      // Check if user owns this feedback
      if (existingFeedback.userFid !== userFid) {
        return NextResponse.json(
          { error: "Unauthorized to edit this feedback" },
          { status: 403 }
        );
      }

      const updatedFeedback = {
        rating,
        comment: comment || "",
        userDisplayName,
        userPfpUrl,
        updatedAt: new Date(),
      };

      await feedbackCollection.updateOne(
        { _id: new ObjectId(feedbackId) },
        { $set: updatedFeedback }
      );

      // Update app statistics
      const allFeedback = await feedbackCollection.find({ appId }).toArray();
      const totalRatings = allFeedback.length;
      const averageRating =
        allFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) /
        totalRatings;

      await appsCollection.updateOne(
        { appId },
        {
          $set: {
            totalRatings,
            averageRating: Math.round(averageRating * 10) / 10,
            totalFeedback: totalRatings,
            updatedAt: new Date(),
          },
        }
      );

      // Send notification to app owner about feedback update
      try {
        const reviewerName = userDisplayName || userName || "Someone";
        const ratingText = rating === 1 ? "1 star" : `${rating} stars`;
        const commentText = comment && comment.trim() ? " with a comment" : "";

        const title = `Feedback updated on ${app.name}`;
        const body = `${reviewerName} updated their feedback to ${ratingText}${commentText}.`;

        // Get notification details for the app owner
        const { getUserNotificationDetails } = await import("~/lib/kv");
        const notificationDetails = await getUserNotificationDetails(
          app.ownerFid
        );

        if (notificationDetails) {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
            }/api/send-custom-notification`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fid: app.ownerFid,
                title,
                body,
                notificationDetails,
              }),
            }
          );

          if (response.status !== 200) {
            console.error(
              "Failed to send notification for feedback update:",
              await response.text()
            );
          }
        }
      } catch (notificationError) {
        console.error(
          "Failed to send notification for feedback update:",
          notificationError
        );
        // Don't fail the request if notification fails
      }

      return NextResponse.json({
        success: true,
        message: "Feedback updated successfully",
      });
    } else {
      // Check if user already has feedback for this app
      const existingUserFeedback = await feedbackCollection.findOne({
        appId,
        userFid,
      });

      if (existingUserFeedback) {
        return NextResponse.json(
          { error: "You have already provided feedback for this app" },
          { status: 400 }
        );
      }

      // Create new feedback
      const newFeedback: Omit<Feedback, "_id"> = {
        appId,
        rating,
        comment: comment || "",
        userFid,
        userName,
        userDisplayName,
        userPfpUrl,
        createdAt: new Date(),
      };

      const result = await feedbackCollection.insertOne(newFeedback);

      // Update app statistics
      const allFeedback = await feedbackCollection.find({ appId }).toArray();
      const totalRatings = allFeedback.length;
      const averageRating =
        allFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) /
        totalRatings;

      await appsCollection.updateOne(
        { appId },
        {
          $set: {
            totalRatings,
            averageRating: Math.round(averageRating * 10) / 10,
            totalFeedback: totalRatings,
            updatedAt: new Date(),
          },
        }
      );

      // Send notification to app owner about new feedback
      try {
        const reviewerName = userDisplayName || userName || "Someone";
        const ratingText = rating === 1 ? "1 star" : `${rating} stars`;
        const commentText = comment && comment.trim() ? " with a comment" : "";

        const title = `New feedback on ${app.name}`;
        const body = `${reviewerName} gave your app ${ratingText}${commentText}! Check it out on MiniScout.`;

        // Get notification details for the app owner
        const { getUserNotificationDetails } = await import("~/lib/kv");
        const notificationDetails = await getUserNotificationDetails(
          app.ownerFid
        );

        if (notificationDetails) {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
            }/api/send-custom-notification`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fid: app.ownerFid,
                title,
                body,
                notificationDetails,
              }),
            }
          );

          if (response.status !== 200) {
            console.error(
              "Failed to send notification for new feedback:",
              await response.text()
            );
          }
        }
      } catch (notificationError) {
        console.error(
          "Failed to send notification for new feedback:",
          notificationError
        );
        // Don't fail the request if notification fails
      }

      return NextResponse.json({
        success: true,
        feedback: { ...newFeedback, _id: result.insertedId },
      });
    }
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("appId");

    const db = await getDb();
    const feedbackCollection = db.collection("feedback");

    if (appId) {
      // Fetch feedback for specific app
      const feedback = await feedbackCollection
        .find({ appId })
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json({ feedback });
    } else {
      // Fetch all feedback
      const feedback = await feedbackCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json({ feedback });
    }
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
