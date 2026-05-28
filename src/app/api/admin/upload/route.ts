import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/upload";
import { UPLOAD_FOLDERS, type UploadFolder } from "@/lib/upload-types";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file");
    const folderRaw = String(formData.get("folder") || "product-lines");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    }

    if (!UPLOAD_FOLDERS.includes(folderRaw as UploadFolder)) {
      return NextResponse.json({ error: "Неверная папка загрузки" }, { status: 400 });
    }

    const url = await saveUploadedImage(file, folderRaw as UploadFolder);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки";
    const status = message === "Forbidden" || message === "Unauthorized" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
