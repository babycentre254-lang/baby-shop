"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Link2,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// Cloudinary helper (shared with product form)
// ═══════════════════════════════════════════════════════════

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const cloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  if (!cloudinaryConfigured) throw new Error("CLOUDINARY_NOT_CONFIGURED");

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET!);
    form.append("folder", "babycentre/categories");

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).secure_url);
        } catch {
          reject(new Error("Invalid Cloudinary response"));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(form);
  });
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

interface Props {
  /** Label shown above the picker */
  label: string;
  /** Optional helper text */
  hint?: string;
  /** Current image URL */
  value: string | null;
  /** Callback when the image is set/cleared */
  onChange: (url: string | null) => void;
  /** Aspect ratio for the preview box */
  aspect?: "square" | "banner";
  /** Whether to show the URL input tab (default true) */
  allowUrl?: boolean;
  /** Max file size in MB */
  maxFileSizeMb?: number;
  /** Optional emoji/icon fallback if no image */
  fallbackEmoji?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/avif"];

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function ImagePicker({
  label,
  hint,
  value,
  onChange,
  aspect = "square",
  allowUrl = true,
  maxFileSizeMb = 5,
  fallbackEmoji,
}: Props) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dropActive, setDropActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-[16/6]";

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported format. Use JPG, PNG, WebP, SVG, or AVIF.");
      return;
    }
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      setError(`File exceeds ${maxFileSizeMb} MB.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      let url: string;
      if (cloudinaryConfigured) {
        url = await uploadToCloudinary(file, setProgress);
      } else {
        url = await fileToDataUrl(file);
      }
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function addByUrl() {
    const url = urlInput.trim();
    if (!url) return;
    try {
      const u = new URL(url);
      if (!u.protocol.startsWith("http")) throw new Error();
    } catch {
      setError("Enter a valid URL starting with http:// or https://");
      return;
    }
    setError(null);
    onChange(url);
    setUrlInput("");
  }

  function removeImage() {
    onChange(null);
    setError(null);
  }

  const cloudinaryMissing = !cloudinaryConfigured;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink-700">{label}</label>
        {value && (
          <button
            type="button"
            onClick={removeImage}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-pink-600 hover:text-pink-700"
          >
            <X className="h-3 w-3" />
            Remove
          </button>
        )}
      </div>

      {hint && <p className="text-xs text-ink-500">{hint}</p>}

      {/* Preview */}
      {value ? (
        <div
          className={cn(
            "relative rounded-2xl border-2 border-cream-300 overflow-hidden bg-cream-100 group",
            aspectClass
          )}
        >
          <Image
            src={value}
            alt={label}
            fill
            sizes="320px"
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = "0.3";
            }}
          />

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-ink-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-3 rounded-lg bg-white text-ink-900 text-xs font-semibold flex items-center gap-1.5 hover:bg-cream-100 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(value);
              }}
              className="h-10 w-10 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Copy URL"
            >
              <Link2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Mode tabs */}
          {allowUrl && (
            <div className="flex mb-2 rounded-xl border-2 border-cream-300 bg-cream-50 p-0.5">
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium transition-colors",
                  mode === "upload"
                    ? "bg-white text-ink-900 shadow-sm"
                    : "text-ink-500 hover:text-ink-800"
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
              <button
                type="button"
                onClick={() => setMode("url")}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium transition-colors",
                  mode === "url"
                    ? "bg-white text-ink-900 shadow-sm"
                    : "text-ink-500 hover:text-ink-800"
                )}
              >
                <Link2 className="h-3.5 w-3.5" />
                URL
              </button>
            </div>
          )}

          {mode === "upload" || !allowUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDropActive(true);
              }}
              onDragLeave={() => setDropActive(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={cn(
                "rounded-2xl border-2 border-dashed cursor-pointer transition-all",
                aspectClass,
                "flex flex-col items-center justify-center gap-2",
                dropActive
                  ? "border-blue-400 bg-blue-50 scale-[1.01]"
                  : "border-cream-300 bg-cream-50 hover:border-blue-300 hover:bg-blue-50/40",
                uploading && "opacity-60 cursor-wait"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <div className="w-24 h-1 rounded-full bg-cream-300 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink-500">{progress}%</p>
                </>
              ) : (
                <>
                  {fallbackEmoji ? (
                    <span className="text-4xl">{fallbackEmoji}</span>
                  ) : (
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="text-center px-4">
                    <p className="text-xs font-medium text-ink-700">
                      Click to browse or drag & drop
                    </p>
                    <p className="text-[10px] text-ink-400 mt-0.5">
                      JPG, PNG, WebP, SVG · up to {maxFileSizeMb} MB
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={cn("rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50 p-3", aspectClass, "flex flex-col justify-center gap-2")}>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addByUrl())}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full h-10 rounded-lg border-2 border-ink-200 bg-white pl-9 pr-3 text-xs focus:border-blue-400 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={addByUrl}
                disabled={!urlInput.trim()}
                className="h-9 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Use this URL
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileInput}
        className="hidden"
      />

      {error && (
        <div className="flex items-start gap-2 text-xs text-pink-600 rounded-lg bg-pink-50 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-pink-500 hover:text-pink-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {cloudinaryMissing && mode === "upload" && !value && (
        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
          Cloudinary not configured — uploads will be stored as base64. Add{" "}
          <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code> to{" "}
          <code>.env.local</code>.
        </p>
      )}
    </div>
  );
}