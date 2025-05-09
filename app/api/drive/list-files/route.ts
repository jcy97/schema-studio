import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: session.accessToken as string });

    const drive = google.drive({ version: "v3", auth });
    const response = await drive.files.list({
      q: "name contains '.scst' and trashed = false",
      fields: "files(id, name, description, modifiedTime)",
      orderBy: "modifiedTime desc",
    });

    return NextResponse.json(response.data.files || []);
  } catch (error: any) {
    console.error("Google Drive 파일 목록 조회 오류:", error);
    return NextResponse.json(
      {
        error: "파일 목록을 가져오는 중 오류가 발생했습니다",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
