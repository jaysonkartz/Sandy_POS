import { NextRequest, NextResponse } from "next/server";
import { SignInLogger } from "@/app/lib/signin-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, success, failureReason, sessionId, userAgent } = body;

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ipAddress = SignInLogger.getClientIP(request);

    const deviceInfo = SignInLogger.getDeviceInfo(userAgent);

    await SignInLogger.logSignIn({
      userId,
      email,
      success: success || false,
      failureReason: failureReason || undefined,
      sessionId: sessionId || undefined,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      deviceInfo: deviceInfo || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging sign-in:", error);
    return NextResponse.json({ error: "Failed to log sign-in" }, { status: 500 });
  }
}
