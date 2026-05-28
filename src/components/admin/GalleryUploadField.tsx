"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { adminInputCls } from "./AdminPrimitives";
import type { UploadFolder } from "@/lib/upload-types";

interface GalleryUploadFieldProps {
  value: string;
  onChange: (value: string) => void;
  folder?: UploadFolder;
}

function parseUrls(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function urlsToText(urls: string[]): string {
  return urls.join("\n");
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

export function GalleryUploadField({ value, onChange, folder = "product-lines" }: GalleryUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const urls = parseUrls(value);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setError("");
    setUploading(true);

    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadImage(file, folder));
      }
      onChange(urlsToText([...urls, ...uploaded]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeUrl(index: number) {
    onChange(urlsToText(urls.filter((_, i) => i !== index)));
  }

  return (
    <div className="space-y-3">
      {urls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
            >
              <div className="relative aspect-video w-full">
                <Image src={url} alt="" fill unoptimized className="object-cover" />
              </div>
              <button
                type="button"
                onClick={() => removeUrl(index)}
                className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                aria-label="Удалить изображение"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-6 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
            Загрузка…
          </>
        ) : (
          <>
            <ImagePlus className="h-5 w-5 text-gold" />
            Загрузить изображения в галерею
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={adminInputCls}
        placeholder="Или вставьте ссылки — по одной на строку"
      />

      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
