import { NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, image } = body;

    // Validate required fields
    if (!name || !description || !image) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, image" },
        { status: 400 }
      );
    }

    // Check if Pinata credentials are available
    if (!process.env.PINATA_JWT || !process.env.PINATA_GATEWAY) {
      return NextResponse.json(
        { error: "Pinata configuration not found" },
        { status: 500 }
      );
    }

    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.PINATA_GATEWAY,
    });

    // Upload metadata to Pinata
    const upload = await pinata.upload.public.json({
      name,
      description,
      image,
    });

    const ipfsHash = upload.cid;

    if (!ipfsHash) {
      throw new Error("No IPFS hash found in upload response");
    }

    return NextResponse.json({
      success: true,
      metadataUri: ipfsHash,
      gatewayUrl: `https://${process.env.PINATA_GATEWAY}/ipfs/${ipfsHash}`,
    });
  } catch (error) {
    console.error("Error uploading metadata:", error);
    return NextResponse.json(
      { error: "Failed to upload metadata" },
      { status: 500 }
    );
  }
}
