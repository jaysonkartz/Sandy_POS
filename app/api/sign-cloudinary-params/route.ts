import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { paramsToSign } = await req.json();
  const secret = process.env.CLOUDINARY_API_SECRET;

  try {
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      !!secret ? secret : "",
    );

    return NextResponse.json({
      signature,
    });
  } catch (e) {
    return NextResponse.error();
  }
}
