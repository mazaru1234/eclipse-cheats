import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getUploadFilePath } from "@/lib/upload-path";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

interface RouteProps {
  params: Promise<{ path: string[] }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { path: segments } = await params;
    const filePath = getUploadFilePath(segments);
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const body = await readFile(filePath);

    return new NextResponse(body, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
