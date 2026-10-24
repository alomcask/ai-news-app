import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 페이지는 미로그인 시 홈의 로그인 모달 화면을 보여주고, API는 401로 차단한다.
export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname.startsWith("/api")) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
});

export const config = {
  matcher: [
    // Next.js 내부 파일과 정적 파일은 제외
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
