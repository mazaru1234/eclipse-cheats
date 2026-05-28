import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import type { UploadFolder } from "@/lib/upload-types";
import { getUploadRoot } from "@/lib/upload-path";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 5 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function saveUploadedImage(file: File, folder: UploadFolder): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Поддерживаются только JPG, PNG, WebP и GIF");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("Файл слишком большой (максимум 5 МБ)");
  }

  const ext = EXT_BY_TYPE[file.type];
  const filename = `${nanoid()}${ext}`;
  const uploadDir = path.join(getUploadRoot(), folder);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  return `/uploads/${folder}/${filename}`;
}
