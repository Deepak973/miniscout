import { NextRequest, NextResponse } from "next/server";

export interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  active_status: string;
}

export interface NeynarBulkUsersResponse {
  users: NeynarUser[];
}

/**
 * Fetch user details for multiple FIDs using Neynar API
 * @param fids Array of FIDs to fetch
 * @returns Promise with user details
 */
async function fetchUsersByFids(fids: number[]): Promise<NeynarUser[]> {
  if (fids.length === 0) return [];

  // Limit to 100 FIDs per call as per API docs
  const chunkedFids = [];
  for (let i = 0; i < fids.length; i += 100) {
    chunkedFids.push(fids.slice(i, i + 100));
  }

  const allUsers: NeynarUser[] = [];

  for (const fidsChunk of chunkedFids) {
    try {
      const fidsParam = fidsChunk.join("%2C%20");
      const url = `https://api.neynar.com/v2/farcaster/user/bulk/?fids=${fidsParam}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": process.env.NEYNAR_API_KEY || "",
          "x-neynar-experimental": "false",
        },
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch users for FIDs ${fidsChunk}:`,
          response.statusText
        );
        continue;
      }

      const data: NeynarBulkUsersResponse = await response.json();
      allUsers.push(...data.users);
    } catch (error) {
      console.error(`Error fetching users for FIDs ${fidsChunk}:`, error);
    }
  }

  return allUsers;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fidsParam = searchParams.get("fids");

    if (!fidsParam) {
      return NextResponse.json(
        { success: false, error: "FIDs parameter is required" },
        { status: 400 }
      );
    }

    // Parse FIDs from comma-separated string
    const fids = fidsParam
      .split(",")
      .map((fid) => parseInt(fid.trim()))
      .filter((fid) => !isNaN(fid) && fid > 0);

    if (fids.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid FIDs provided" },
        { status: 400 }
      );
    }

    // Limit to 100 FIDs per request
    if (fids.length > 100) {
      return NextResponse.json(
        { success: false, error: "Maximum 100 FIDs allowed per request" },
        { status: 400 }
      );
    }

    const users = await fetchUsersByFids(fids);

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
      requestedFids: fids,
    });
  } catch (error) {
    console.error("Error in users bulk API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
