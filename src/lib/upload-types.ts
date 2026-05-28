export const UPLOAD_FOLDERS = ["categories", "product-lines"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];
