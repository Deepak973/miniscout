import { NextRequest, NextResponse } from "next/server";
import { getDb } from "~/lib/mongodb";

export async function GET(_request: NextRequest) {
  try {
    const db = await getDb();
    const appsCollection = db.collection("apps");
    const feedbackCollection = db.collection("feedback");

    // Count documents in collections
    const appsCount = await appsCollection.countDocuments();
    const feedbackCount = await feedbackCollection.countDocuments();

    // Get a few sample apps
    const sampleApps = await appsCollection.find({}).limit(5).toArray();

    return NextResponse.json({
      success: true,
      database: "connected",
      appsCount,
      feedbackCount,
      sampleApps: sampleApps.map((app) => ({
        appId: app.appId,
        name: app.name,
        createdAt: app.createdAt,
      })),
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
