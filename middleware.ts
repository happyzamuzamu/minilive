// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 개발 단계: 인증 건너뛰고 모두 통과
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

/**
 * 인증을 걸고 싶은 페이지만 나중에 부분적으로 추가:
 * 예시) matcher: ['/','/leaderboard'] 등.
 * 개발 동안은 api/dev/screen/join/_next 정적자원은 반드시 제외.
 */
export const config = {
  matcher: [
    // 필요 시 특정 페이지만 보호하세요. 지금은 전체 우회.
  ],
};