import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = searchParams.get("limit") || "20";

    // Build URL with query parameter
    const baseUrl = "https://api.neynar.com/v2/farcaster/frame/search/";
    const url = query
      ? `${baseUrl}?limit=${limit}&q=${encodeURIComponent(query)}`
      : `${baseUrl}?limit=${limit}`;

    const options = {
      method: "GET",
      headers: {
        "x-api-key": process.env.NEYNAR_API_KEY || "",
      },
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      frames: data.frames || [],
      total: data.frames?.length || 0,
    });
  } catch (error) {
    console.error("Error searching frames:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search frames",
      },
      { status: 500 }
    );
  }
}
