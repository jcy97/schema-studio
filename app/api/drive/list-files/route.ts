import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { authOptions } from "../../auth/[...nextauth]/auth";

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

    // 토큰 설정
    auth.setCredentials({
      access_token: session.accessToken as string,
      refresh_token: session.refreshToken as string, // 리프레시 토큰 추가
    });

    const drive = google.drive({ version: "v3", auth });

    try {
      const response = await drive.files.list({
        q: "name contains '.scst' and trashed = false",
        fields: "files(id, name, description, modifiedTime)",
        orderBy: "modifiedTime desc",
      });

      return NextResponse.json(response.data.files || []);
    } catch (driveError: any) {
      // 토큰 만료 오류 감지 및 처리
      if (
        driveError.code === 401 ||
        driveError.message?.includes("invalid_token")
      ) {
        return NextResponse.json(
          {
            error: "인증 토큰이 만료되었습니다. 다시 로그인해주세요",
          },
          { status: 401 }
        );
      }

      throw driveError;
    }
  } catch (error: any) {
    console.error("Google Drive 파일 목록 조회 오류:", error);

    // 구체적인 오류 메시지 제공
    const errorMessage =
      error.message || "파일 목록을 가져오는 중 오류가 발생했습니다";
    const statusCode = error.code === 401 ? 401 : 500;

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
      },
      { status: statusCode }
    );
  }
}
