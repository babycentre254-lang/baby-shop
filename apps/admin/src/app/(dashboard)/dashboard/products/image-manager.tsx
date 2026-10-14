"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import Image from "next/image";
import {
  Plus,
  X,
  GripVertical,
  ImageIcon,
  AlertCircle,
  Upload,
  Link2,
  Loader2,
  Pencil,
  Copy,
  Check,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Star,
  LayoutGrid,
  List,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface ProductImageDraft {
  id: string;
  url: string;
  altText: string;
  sortOrder: number;
  /** Local-only flag: set when upload is still in progress */
  uploading?: boolean;
  /** Local-only: upload progress 0-100 */
  progress?: number;
}

interface Props {
  images: ProductImageDraft[];
  onChange: (images: ProductImageDraft[]) => void;
  /** Max number of images allowed */
  maxImages?: number;
  /** Max file size in MB for device uploads */
  maxFileSizeMb?: number;
}

type Mode = "device" | "url";
type ViewMode = "grid" | "list";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// ═══════════════════════════════════════════════════════════
// Cloudinary helper
// ═══════════════════════════════════════════════════════════

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const cloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  if (!cloudinaryConfigured) {
    throw new Error("CLOUDINARY_NOT_CONFIGURED");
  }

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET!);
    form.append("folder", "babycentre/products");

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
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url as string);
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
// Main component
// ═══════════════════════════════════════════════════════════

export function ImageManager({
  images,
  onChange,
  maxImages = 10,
  maxFileSizeMb = 5,
}: Props) {
  const [mode, setMode] = useState<Mode>("device");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [urlInput, setUrlInput] = useState("");
  const [altInput, setAltInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [editingAltValue, setEditingAltValue] = useState("");
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const atMax = images.length >= maxImages;
  const cloudinaryMissing = !cloudinaryConfigured;

  // ─── Handlers ────────────────────────────────────────────

  const addImages = useCallback(
    (newItems: ProductImageDraft[]) => {
      const combined = [...images, ...newItems].map((img, i) => ({
        ...img,
        sortOrder: i,
      }));
      onChange(combined);
    },
    [images, onChange]
  );

  async function handleFiles(files: FileList | File[]) {
    setError(null);

    if (atMax) {
      setError(`Maximum ${maxImages} images.`);
      return;
    }

    const list = Array.from(files);
    const remaining = maxImages - images.length;
    const toProcess = list.slice(0, remaining);

    // Validate all first
    for (const file of toProcess) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(
          `"${file.name}" — unsupported format. Use JPG, PNG, WebP, or AVIF.`
        );
        return;
      }
      if (file.size > maxFileSizeMb * 1024 * 1024) {
        setError(`"${file.name}" exceeds ${maxFileSizeMb} MB.`);
        return;
      }
    }

    // Insert placeholders immediately
    const placeholders: ProductImageDraft[] = toProcess.map((file) => ({
      id: crypto.randomUUID(),
      url: "",
      altText: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      sortOrder: 0,
      uploading: true,
      progress: 0,
    }));

    const startIndex = images.length;
    const combined = [...images, ...placeholders].map((img, i) => ({
      ...img,
      sortOrder: i,
    }));
    onChange(combined);

    // Upload in parallel
    await Promise.all(
      toProcess.map(async (file, i) => {
        const placeholderId = placeholders[i].id;
        try {
          let url: string;
          if (cloudinaryConfigured) {
            url = await uploadToCloudinary(file, (pct) => {
              // Update progress in-place
              const current = imagesRef.current;
              const idx = current.findIndex((im) => im.id === placeholderId);
              if (idx >= 0) {
                const next = [...current];
                next[idx] = { ...next[idx], progress: pct };
                onChange(next);
              }
            });
          } else {
            // Fallback: base64 inline (dev only)
            url = await fileToDataUrl(file);
          }

          // Replace placeholder with real URL
          const current = imagesRef.current;
          const idx = current.findIndex((im) => im.id === placeholderId);
          if (idx >= 0) {
            const next = [...current];
            next[idx] = {
              ...next[idx],
              url,
              uploading: false,
              progress: 100,
            };
            onChange(next);
          }
        } catch (err) {
          // Remove failed upload
          const current = imagesRef.current;
          onChange(current.filter((im) => im.id !== placeholderId));
          setError(
            err instanceof Error
              ? `"${file.name}": ${err.message}`
              : `"${file.name}" failed to upload.`
          );
        }
      })
    );
  }

  // Ref to always have the latest images inside async callbacks
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = ""; // reset so same file can be re-selected
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDropActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
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

    if (atMax) {
      setError(`Maximum ${maxImages} images.`);
      return;
    }

    setError(null);
    addImages([
      {
        id: crypto.randomUUID(),
        url,
        altText: altInput.trim(),
        sortOrder: images.length,
      },
    ]);
    setUrlInput("");
    setAltInput("");
  }

  function removeImage(id: string) {
    onChange(
      images
        .filter((img) => img.id !== id)
        .map((img, i) => ({ ...img, sortOrder: i }))
    );
  }

  function moveImage(from: number, to: number) {
    if (from === to || to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next.map((img, i) => ({ ...img, sortOrder: i })));
  }

  function setPrimary(id: string) {
    const idx = images.findIndex((img) => img.id === id);
    if (idx <= 0) return;
    moveImage(idx, 0);
  }

  function startEditAlt(img: ProductImageDraft) {
    setEditingAltId(img.id);
    setEditingAltValue(img.altText);
  }

  function saveAlt() {
    if (!editingAltId) return;
    onChange(
      images.map((img) =>
        img.id === editingAltId ? { ...img, altText: editingAltValue } : img
      )
    );
    setEditingAltId(null);
    setEditingAltValue("");
  }

  async function copyUrl(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* noop */
    }
  }

  // ─── Replace flow ────────────────────────────────────────

  function triggerReplace(id: string) {
    setReplacingId(id);
    replaceInputRef.current?.click();
  }

  async function handleReplaceFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = replacingId;
    e.target.value = "";
    setReplacingId(null);

    if (!file || !id) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported format. Use JPG, PNG, WebP, or AVIF.");
      return;
    }
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      setError(`File exceeds ${maxFileSizeMb} MB.`);
      return;
    }

    // Show uploading state on this slot
    onChange(
      images.map((img) =>
        img.id === id ? { ...img, uploading: true, progress: 0 } : img
      )
    );

    try {
      let url: string;
      if (cloudinaryConfigured) {
        url = await uploadToCloudinary(file, (pct) => {
          onChange(
            imagesRef.current.map((img) =>
              img.id === id ? { ...img, progress: pct } : img
            )
          );
        });
      } else {
        url = await fileToDataUrl(file);
      }
      onChange(
        imagesRef.current.map((img) =>
          img.id === id ? { ...img, url, uploading: false, progress: 100 } : img
        )
      );
    } catch (err) {
      onChange(
        imagesRef.current.map((img) =>
          img.id === id ? { ...img, uploading: false, progress: 0 } : img
        )
      );
      setError(err instanceof Error ? err.message : "Replace failed");
    }
  }

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleReplaceFile}
        className="hidden"
      />

      {/* ─── Input panel ─── */}
      <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
        {/* Mode tabs */}
        <div className="flex border-b border-cream-200">
          <ModeTab
            active={mode === "device"}
            onClick={() => setMode("device")}
            icon={<Upload className="h-4 w-4" />}
            label="Upload from device"
          />
          <ModeTab
            active={mode === "url"}
            onClick={() => setMode("url")}
            icon={<Link2 className="h-4 w-4" />}
            label="Add by URL"
          />
        </div>

        <div className="p-4">
          {mode === "device" ? (
            <DropZone
              active={dropActive}
              disabled={atMax}
              cloudinaryMissing={cloudinaryMissing}
              maxFileSizeMb={maxFileSizeMb}
              onDragOver={(e) => {
                e.preventDefault();
                setDropActive(true);
              }}
              onDragLeave={() => setDropActive(false)}
              onDrop={handleDrop}
              onBrowse={() => fileInputRef.current?.click()}
            />
          ) : (
            <UrlInput
              urlInput={urlInput}
              altInput={altInput}
              onUrlChange={setUrlInput}
              onAltChange={setAltInput}
              onSubmit={addByUrl}
              disabled={atMax}
            />
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 text-xs text-pink-600 rounded-lg bg-pink-50 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-pink-500 hover:text-pink-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {atMax && (
            <div className="mt-3 text-xs text-ink-500 text-center">
              Maximum of {maxImages} images reached.
            </div>
          )}

          {cloudinaryMissing && mode === "device" && (
            <div className="mt-3 flex items-start gap-2 text-[11px] text-amber-700 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Cloudinary isn't configured. Uploads will be stored as base64
                data URLs (fine for testing). See <code>.env.local</code>.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Gallery ─── */}
      {images.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-ink-500">
              <strong className="text-ink-800">{images.length}</strong> of{" "}
              {maxImages} images · first is the primary thumbnail
            </p>
            <div className="flex items-center gap-1 p-0.5 rounded-lg border border-cream-300">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                  viewMode === "grid"
                    ? "bg-ink-900 text-white"
                    : "text-ink-500 hover:bg-cream-100"
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                  viewMode === "list"
                    ? "bg-ink-900 text-white"
                    : "text-ink-500 hover:bg-cream-100"
                )}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  index={i}
                  isPrimary={i === 0}
                  isDragging={dragIndex === i}
                  editingAltId={editingAltId}
                  editingAltValue={editingAltValue}
                  copiedId={copiedId}
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) moveImage(dragIndex, i);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  onMoveLeft={() => moveImage(i, i - 1)}
                  onMoveRight={() => moveImage(i, i + 1)}
                  onRemove={() => removeImage(img.id)}
                  onSetPrimary={() => setPrimary(img.id)}
                  onStartEditAlt={() => startEditAlt(img)}
                  onEditAltChange={setEditingAltValue}
                  onSaveAlt={saveAlt}
                  onCancelEditAlt={() => {
                    setEditingAltId(null);
                    setEditingAltValue("");
                  }}
                  onCopyUrl={() => copyUrl(img.url, img.id)}
                  onReplace={() => triggerReplace(img.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {images.map((img, i) => (
                <ImageRow
                  key={img.id}
                  image={img}
                  index={i}
                  isPrimary={i === 0}
                  onMoveLeft={() => moveImage(i, i - 1)}
                  onMoveRight={() => moveImage(i, i + 1)}
                  onRemove={() => removeImage(img.id)}
                  onSetPrimary={() => setPrimary(img.id)}
                  onReplace={() => triggerReplace(img.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {images.length === 0 && (
        <p className="text-xs text-ink-400 text-center py-4">
          No images yet. The first image is used as the product thumbnail.
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-2 h-12 text-sm font-medium transition-colors",
        active
          ? "text-blue-600 border-b-2 border-blue-500 bg-blue-50/40"
          : "text-ink-500 hover:text-ink-800 hover:bg-cream-50 border-b-2 border-transparent"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function DropZone({
  active,
  disabled,
  cloudinaryMissing,
  maxFileSizeMb,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
}: {
  active: boolean;
  disabled: boolean;
  cloudinaryMissing: boolean;
  maxFileSizeMb: number;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onBrowse: () => void;
}) {
  return (
    <div
      onDragOver={disabled ? undefined : onDragOver}
      onDragLeave={onDragLeave}
      onDrop={disabled ? undefined : onDrop}
      className={cn(
        "relative rounded-2xl border-2 border-dashed p-6 transition-all",
        disabled
          ? "border-cream-300 bg-cream-50 opacity-60 cursor-not-allowed"
          : active
          ? "border-blue-400 bg-blue-50 scale-[1.01]"
          : "border-cream-300 bg-cream-50 hover:border-blue-300 hover:bg-blue-50/40"
      )}
    >
      <div className="flex flex-col items-center text-center gap-3">
        <div
          className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
            active ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-500"
          )}
        >
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-800">
            {active
              ? "Drop images here"
              : "Drag & drop images, or click to browse"}
          </p>
          <p className="text-xs text-ink-500 mt-0.5">
            JPG, PNG, WebP, AVIF · up to {maxFileSizeMb} MB each
            {cloudinaryMissing && " · stored as base64 (dev mode)"}
          </p>
        </div>
        <button
          type="button"
          onClick={disabled ? undefined : onBrowse}
          disabled={disabled}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Choose files
        </button>
      </div>
    </div>
  );
}

function UrlInput({
  urlInput,
  altInput,
  onUrlChange,
  onAltChange,
  onSubmit,
  disabled,
}: {
  urlInput: string;
  altInput: string;
  onUrlChange: (v: string) => void;
  onAltChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <div className="relative">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="https://res.cloudinary.com/..."
            className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white pl-10 pr-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <input
          type="text"
          value={altInput}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="Alt text (optional)"
          className="h-11 rounded-xl border-2 border-ink-200 bg-white px-3.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!urlInput.trim() || disabled}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add image
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Image Card (grid view)
// ═══════════════════════════════════════════════════════════

function ImageCard({
  image,
  index,
  isPrimary,
  isDragging,
  editingAltId,
  editingAltValue,
  copiedId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveLeft,
  onMoveRight,
  onRemove,
  onSetPrimary,
  onStartEditAlt,
  onEditAltChange,
  onSaveAlt,
  onCancelEditAlt,
  onCopyUrl,
  onReplace,
}: {
  image: ProductImageDraft;
  index: number;
  isPrimary: boolean;
  isDragging: boolean;
  editingAltId: string | null;
  editingAltValue: string;
  copiedId: string | null;
  onDragStart: () => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRemove: () => void;
  onSetPrimary: () => void;
  onStartEditAlt: () => void;
  onEditAltChange: (v: string) => void;
  onSaveAlt: () => void;
  onCancelEditAlt: () => void;
  onCopyUrl: () => void;
  onReplace: () => void;
}) {
  const isEditingAlt = editingAltId === image.id;
  const wasCopied = copiedId === image.id;

  return (
    <div
      draggable={!image.uploading && !isEditingAlt}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative aspect-square rounded-2xl border-2 bg-cream-100 overflow-hidden transition-all",
        isPrimary ? "border-blue-500 ring-2 ring-blue-100" : "border-cream-300",
        isDragging && "opacity-50 scale-95",
        !image.uploading && "cursor-move"
      )}
    >
      {/* Image or uploading placeholder */}
      {image.uploading || !image.url ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-cream-100">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          <div className="w-16 h-1 rounded-full bg-cream-300 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${image.progress ?? 0}%` }}
            />
          </div>
          <p className="text-[10px] text-ink-500">
            {image.progress ?? 0}%
          </p>
        </div>
      ) : (
        <Image
          src={image.url}
          alt={image.altText || "Product image"}
          fill
          sizes="240px"
          className="object-cover"
        />
      )}

      {/* Top overlays */}
      {!image.uploading && (
        <>
          {isPrimary ? (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold shadow">
              <Star className="h-2.5 w-2.5 fill-white" />
              Primary
            </span>
          ) : (
            <button
              type="button"
              onClick={onSetPrimary}
              className="absolute top-2 left-2 h-6 px-2 rounded-full bg-white/90 text-ink-700 text-[10px] font-semibold shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              Set primary
            </button>
          )}

          <div className="absolute top-2 right-2 h-6 w-6 rounded-lg bg-ink-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </>
      )}

      {/* Bottom overlay — hover actions */}
      {!image.uploading && !isEditingAlt && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/90 via-ink-900/60 to-transparent pt-8 pb-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-center gap-1">
            <ActionBtn onClick={onMoveLeft} disabled={index === 0} title="Move left">
              <ArrowLeft className="h-3.5 w-3.5" />
            </ActionBtn>
            <ActionBtn
              onClick={onMoveRight}
              disabled={index === 999}
              title="Move right"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </ActionBtn>
            <ActionBtn onClick={onReplace} title="Replace">
              <RefreshCw className="h-3.5 w-3.5" />
            </ActionBtn>
            <ActionBtn onClick={onStartEditAlt} title="Edit alt text">
              <Pencil className="h-3.5 w-3.5" />
            </ActionBtn>
            <ActionBtn onClick={onCopyUrl} title="Copy URL">
              {wasCopied ? (
                <Check className="h-3.5 w-3.5 text-sage-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </ActionBtn>
            <ActionBtn onClick={onRemove} title="Remove" variant="danger">
              <Trash2 className="h-3.5 w-3.5" />
            </ActionBtn>
          </div>
        </div>
      )}

      {/* Inline alt text editor */}
      {isEditingAlt && (
        <div className="absolute inset-x-0 bottom-0 bg-white p-2 space-y-1.5">
          <input
            type="text"
            value={editingAltValue}
            onChange={(e) => onEditAltChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveAlt();
              if (e.key === "Escape") onCancelEditAlt();
            }}
            autoFocus
            placeholder="Alt text"
            className="w-full h-8 rounded-md border border-cream-300 px-2 text-xs focus:border-blue-400 focus:outline-none"
          />
          <div className="flex gap-1 justify-end">
            <button
              onClick={onCancelEditAlt}
              className="h-6 px-2 rounded-md text-[10px] text-ink-500 hover:bg-cream-100"
            >
              Cancel
            </button>
            <button
              onClick={onSaveAlt}
              className="h-6 px-2 rounded-md bg-blue-500 text-white text-[10px] font-semibold hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Non-editing alt preview */}
      {!isEditingAlt && image.altText && !image.uploading && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink-900/80 to-transparent pt-6 pb-1.5 px-2 group-hover:opacity-0 transition-opacity pointer-events-none">
          <p className="text-[10px] text-white/90 truncate">
            {image.altText}
          </p>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  onClick,
  disabled,
  title,
  variant = "default",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
        variant === "danger"
          ? "text-pink-300 hover:text-white hover:bg-pink-500"
          : "text-white/80 hover:text-white hover:bg-white/20",
        disabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
      )}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// Image Row (list view)
// ═══════════════════════════════════════════════════════════

function ImageRow({
  image,
  index,
  isPrimary,
  onMoveLeft,
  onMoveRight,
  onRemove,
  onSetPrimary,
  onReplace,
}: {
  image: ProductImageDraft;
  index: number;
  isPrimary: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRemove: () => void;
  onSetPrimary: () => void;
  onReplace: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-cream-300 bg-white hover:border-blue-200 transition-colors">
      <div className="h-14 w-14 rounded-lg bg-cream-100 border border-cream-200 overflow-hidden relative shrink-0">
        {image.url ? (
          <Image
            src={image.url}
            alt={image.altText || "Product image"}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isPrimary && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
              <Star className="h-2.5 w-2.5 fill-white" />
              Primary
            </span>
          )}
          <p className="text-sm font-medium text-ink-900 truncate">
            {image.altText || "(no alt text)"}
          </p>
        </div>
        <p className="text-xs text-ink-500 truncate font-mono">
          {image.url || "Uploading…"}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <ActionBtn onClick={onMoveLeft} disabled={index === 0} title="Move up">
          <ArrowLeft className="h-3.5 w-3.5" />
        </ActionBtn>
        <ActionBtn onClick={onMoveRight} title="Move down">
          <ArrowRight className="h-3.5 w-3.5" />
        </ActionBtn>
        {!isPrimary && (
          <button
            onClick={onSetPrimary}
            className="h-8 px-2 rounded-lg text-[11px] font-semibold text-blue-600 hover:bg-blue-50"
          >
            Primary
          </button>
        )}
        <button
          onClick={onReplace}
          className="h-8 w-8 rounded-lg text-ink-500 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center"
          aria-label="Replace"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onRemove}
          className="h-8 w-8 rounded-lg text-ink-500 hover:text-pink-600 hover:bg-pink-50 flex items-center justify-center"
          aria-label="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}