"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { adminInputCls } from "./AdminPrimitives";
import type { UploadFolder } from "@/lib/upload-types";

interface ImageUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  folder?: UploadFolder;
  placeholder?: string;
}

async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Не удалось загрузить файл");
  }

  return data.url as string;
}

export function ImageUploadField({
  value,
  onChange,
  folder = "product-lines",
  placeholder = "https://... или загрузите файл",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
          <div className="relative aspect-video max-h-52 w-full">
            <Image src={value} alt="" fill unoptimized className="object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white hover:bg-black/80"
            aria-label="Удалить изображение"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-10 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
              Загрузка…
            </>
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-gold" />
              Нажмите или перетащите изображение
              <span className="text-xs text-[var(--color-text-muted)]">JPG, PNG, WebP, GIF · до 5 МБ</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={adminInputCls}
          placeholder={placeholder}
        />
        {value && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn btn-ghost shrink-0 px-3 text-xs"
          >
            Заменить
          </button>
        )}
      </div>

      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
