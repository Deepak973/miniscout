import { NextRequest, NextResponse } from "next/server";
import { getDb } from "~/lib/mongodb";
import { MiniApp, AppRegistrationData } from "~/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      iconUrl,
      splashUrl,
      homeUrl,
      miniappUrl,
      metadata,
      ownerFid,
    } = body as AppRegistrationData & { ownerFid: number };

    if (
      !name ||
      !description ||
      !iconUrl ||
      !homeUrl ||
      !miniappUrl ||
      !ownerFid
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const appsCollection = db.collection("apps");

    // Check if miniappUrl already exists
    const existingApp = await appsCollection.findOne({ miniappUrl });
    if (existingApp) {
      return NextResponse.json(
        { error: "A mini app with this URL is already registered" },
        { status: 409 }
      );
    }

    // Generate unique app ID
    const appId = `app_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newApp: Omit<MiniApp, "_id"> = {
      appId,
      name,
      description,
      iconUrl,
      splashUrl: splashUrl || iconUrl,
      homeUrl,
      miniappUrl,
      metadata,
      ownerFid,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalRatings: 0,
      averageRating: 0,
      totalFeedback: 0,
    };

    const result = await appsCollection.insertOne(newApp);

    return NextResponse.json({
      success: true,
      app: { ...newApp, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error registering app:", error);
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
    const ownerFid = searchParams.get("ownerFid");
    const domain = searchParams.get("domain");

    const db = await getDb();
    const appsCollection = db.collection("apps");

    // If no specific query, return all apps for debugging
    if (!appId && !ownerFid && !domain) {
      const allApps = await appsCollection.find({}).toArray();
      return NextResponse.json({ apps: allApps });
    }

    const query: any = {};

    if (appId) {
      query.appId = appId;
    }

    if (ownerFid) {
      query.ownerFid = parseInt(ownerFid);
    }

    if (domain) {
      // Check if any app has this domain in their homeUrl
      query.homeUrl = { $regex: domain, $options: "i" };
    }

    const apps = await appsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ apps });
  } catch (error) {
    console.error("Error fetching apps:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
