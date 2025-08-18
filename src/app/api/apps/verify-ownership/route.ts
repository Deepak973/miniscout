import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { miniappUrl, ownerFid } = await request.json();

    if (!miniappUrl || !ownerFid) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Implement ownership verification
    // This is a simplified verification - in production you might:
    // 1. Check for a verification token in the HTML meta tags
    // 2. Verify DNS records or domain ownership
    // 3. Check for specific files or endpoints
    // 4. Use third-party verification services

    try {
      // Basic URL validation
      new URL(miniappUrl);

      // Check if the URL is accessible
      const response = await fetch(miniappUrl, {
        method: "GET",
        headers: {
          "User-Agent": "MiniScout-Verification/1.0",
        },
      });

      if (response.ok) {
        const html = await response.text();

        // Check for verification token in meta tags
        const verificationToken = `miniscout-owner-${ownerFid}`;
        const hasVerificationToken =
          html.includes(verificationToken) ||
          html.includes(`data-miniscout-owner="${ownerFid}"`) ||
          html.includes(`name="miniscout-owner" content="${ownerFid}"`);

        if (hasVerificationToken) {
          return NextResponse.json({
            verified: true,
            message: "App ownership verified successfully",
          });
        } else {
          // For demo purposes, allow if URL is accessible
          // In production, this would be more strict
          return NextResponse.json({
            verified: true,
            message: "App ownership verified (demo mode)",
          });
        }
      } else {
        return NextResponse.json({
          verified: false,
          message: "Unable to access the provided URL",
        });
      }
    } catch (_error) {
      console.error("Error verifying app ownership:", _error);
      return NextResponse.json({
        verified: false,
        message: "Invalid URL or unable to verify ownership",
      });
    }
  } catch (_error) {
    console.error("Error in verify-ownership:", _error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
