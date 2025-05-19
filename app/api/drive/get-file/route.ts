import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { authOptions } from "../../auth/[...nextauth]/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const fileId = request.nextUrl.searchParams.get("fileId");

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
  }

  if (!fileId) {
    return NextResponse.json(
      { error: "파일 ID가 필요합니다" },
      { status: 400 }
    );
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: session.accessToken as string });

    const drive = google.drive({ version: "v3", auth });
    const response = await drive.files.get({
      fileId,
      alt: "media",
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Google Drive 파일 읽기 오류:", error);
    return NextResponse.json(
      { error: "파일을 읽는 중 오류가 발생했습니다", details: error.message },
      { status: 500 }
    );
  }
}
