import path from "path";

export function getUploadRoot() {
  const configured = process.env.UPLOADS_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), "public", "uploads");
}

export function getUploadFilePath(segments: string[]) {
  const root = path.resolve(getUploadRoot());
  const filePath = path.resolve(root, ...segments);

  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid path");
  }

  return filePath;
}
