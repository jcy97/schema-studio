import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fileName, content, existingFileId, description } = body;

    if (!fileName || !content) {
      return NextResponse.json(
        { error: "파일 이름과 내용이 필요합니다" },
        { status: 400 }
      );
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: session.accessToken as string });

    const drive = google.drive({ version: "v3", auth });
    const fileMetadata = {
      name: `${fileName}.scst`,
      description: description,
      mimeType: "application/json",
    };

    let fileId;

    if (existingFileId) {
      // 기존 파일 업데이트
      await drive.files.update({
        fileId: existingFileId,
        requestBody: fileMetadata,
        media: {
          mimeType: "application/json",
          body: content,
        },
      });
      fileId = existingFileId;
    } else {
      // 새 파일 생성
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: "application/json",
          body: content,
        },
        fields: "id",
      });

      fileId = response.data.id;
    }

    return NextResponse.json({ fileId });
  } catch (error: any) {
    console.error("Google Drive 파일 저장 오류:", error);
    return NextResponse.json(
      {
        error: "파일을 저장하는 중 오류가 발생했습니다",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
