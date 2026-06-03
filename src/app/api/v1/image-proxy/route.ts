import { NextRequest, NextResponse } from "next/server";
import { getUA } from "@/lib/scraper/browser";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });

  try {
    const decodedUrl = decodeURIComponent(url);

    const maxSize = parseInt(process.env.IMAGE_PROXY_MAX_SIZE || "10485760");
    const controller = new AbortController();
    const sizeTimer = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": getUA(),
        Referer: "https://bbs.nga.cn/",
      },
      signal: controller.signal,
    });
    clearTimeout(sizeTimer);

    if (!response.ok) {
      return NextResponse.json({ error: "Image fetch failed" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const contentLength = response.headers.get("content-length");
    const size = contentLength ? parseInt(contentLength) : 0;
    if (size > maxSize) return NextResponse.json({ error: "Image too large" }, { status: 413 });

    const maxAge = decodedUrl.includes("/face/") || decodedUrl.includes("/smile/")
      ? "max-age=2592000" : decodedUrl.includes("img.nga.178.com") || decodedUrl.includes("img.nga.cn")
      ? "max-age=604800" : "max-age=259200";

    const upstream = response.body;
    if (!upstream) throw new Error("No body");

    const reader = upstream.getReader();
    let total = 0;
    const stream = new ReadableStream({
      start(controller) {
        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) {
              controller.close();
              return;
            }
            total += value.byteLength;
            if (total > maxSize) {
              controller.error(new Error("Image too large"));
              reader.cancel();
              return;
            }
            controller.enqueue(value);
            return pump();
          });
        }
        pump();
      },
      cancel() {
        reader.cancel();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, ${maxAge}, immutable`,
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Proxy failed" }, { status: 502 });
  }
}
