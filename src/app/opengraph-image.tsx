import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export const alt = "Docksmith";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 사이트 전체 기본 OG 이미지 — 더 구체적인 경로에 opengraph-image가 따로 없으면
// 이게 카톡/트위터 등 공유 미리보기에 쓰인다. 한글이 들어가서 PDF 생성에 이미
// 쓰고 있는 한글 폰트를 그대로 재사용한다(별도 폰트 파일/라이선스 비용 없음).
export default async function Image() {
  const fontData = await readFile(
    join(process.cwd(), "public/fonts/noto-sans-kr-400.woff")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "Noto Sans KR",
        }}
      >
        <div style={{ fontSize: 104, fontWeight: 700 }}>Docksmith</div>
        <div style={{ fontSize: 36, marginTop: 28, color: "#a1a1aa" }}>
          쓰던 양식 그대로, CSV만 올리면 수백 장을 한 번에
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans KR",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
