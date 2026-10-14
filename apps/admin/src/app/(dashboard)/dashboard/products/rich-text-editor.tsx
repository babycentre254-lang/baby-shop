"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Minus,
  Undo,
  Redo,
  Eye,
  Pencil,
  Code2,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxLength?: number;
}

// ═══════════════════════════════════════════════════════════
// Sanitizer — strip scripts, iframes (except YouTube), and event handlers
// ═══════════════════════════════════════════════════════════

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");

  // Remove dangerous tags
  doc.querySelectorAll("script, style, object, embed, form, input, button, meta, link").forEach((el) => el.remove());

  // Remove event-handler attributes and javascript: URLs
  doc.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.toLowerCase();

      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }

      if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  minHeight = 280,
  maxLength = 5000,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"edit" | "preview" | "html">("edit");
  const [focused, setFocused] = useState(false);
  const [html, setHtml] = useState(value);
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageDialog, setImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [youtubeDialog, setYoutubeDialog] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // Sync external value into the contenteditable (only when different)
  useEffect(() => {
    if (mode === "edit" && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    setHtml(value);
  }, [value, mode]);

  // ─── Change handler ─────────────────────────────────────
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const raw = editorRef.current.innerHTML;
    const clean = sanitizeHtml(raw);

    if (clean !== raw) {
      // Save cursor position before replacing
      const sel = window.getSelection();
      const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
      editorRef.current.innerHTML = clean;
      if (range && sel) {
        try {
          sel.removeAllRanges();
          sel.addRange(range);
        } catch {
          /* ignore */
        }
      }
    }

    const text = (editorRef.current.textContent ?? "").trim();

    if (maxLength && text.length > maxLength) return;
    onChange(clean);
    setHtml(clean);
  }, [onChange, maxLength]);

  // ─── Format commands ────────────────────────────────────
  const exec = useCallback((cmd: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    handleInput();
  }, [handleInput]);

  // ─── Keyboard shortcuts ─────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey;
    if (!meta) return;

    switch (e.key.toLowerCase()) {
      case "b":
        e.preventDefault();
        exec("bold");
        break;
      case "i":
        e.preventDefault();
        exec("italic");
        break;
      case "u":
        e.preventDefault();
        exec("underline");
        break;
      case "k":
        e.preventDefault();
        openLinkDialog();
        break;
      case "z":
        e.preventDefault();
        exec(e.shiftKey ? "redo" : "undo");
        break;
    }
  }

  // ─── Link ───────────────────────────────────────────────
  function openLinkDialog() {
    const sel = window.getSelection();
    const selectedText = sel?.toString() ?? "";
    setLinkText(selectedText);
    setLinkUrl("");
    setLinkDialog(true);
  }

  function insertLink() {
    if (!linkUrl) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    const text = linkText.trim() || url;
    exec(
      "insertHTML",
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`
    );

    setLinkDialog(false);
    setLinkUrl("");
    setLinkText("");
  }

  // ─── Image ──────────────────────────────────────────────
  function openImageDialog() {
    setImageUrl("");
    setImageAlt("");
    setImageDialog(true);
  }

  function insertImage() {
    if (!imageUrl) return;
    const url = imageUrl.trim();
    const alt = imageAlt.trim();
    exec(
      "insertHTML",
      `<img src="${url}" alt="${escapeHtml(alt)}" style="max-width:100%;height:auto;border-radius:0.75rem;margin:0.5rem 0;" />`
    );
    setImageDialog(false);
  }

  // ─── YouTube ────────────────────────────────────────────
  function openYoutubeDialog() {
    setYoutubeUrl("");
    setYoutubeDialog(true);
  }

  function insertYoutube() {
    const id = extractYoutubeId(youtubeUrl);
    if (!id) return;
    const embed = `<div style="position:relative;padding-bottom:56.25%;height:0;margin:1rem 0;border-radius:0.75rem;overflow:hidden;"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div>`;
    exec("insertHTML", embed);
    setYoutubeDialog(false);
  }

  // ─── Mode switching ─────────────────────────────────────
  function toggleMode(next: "edit" | "preview" | "html") {
    if (mode === "edit" && next !== "edit" && editorRef.current) {
      const current = editorRef.current.innerHTML;
      onChange(sanitizeHtml(current));
      setHtml(current);
    }
    if (next === "edit" && editorRef.current) {
      // Restore into editor on switch back
      editorRef.current.innerHTML = html;
    }
    setMode(next);
  }

  function handleHtmlChange(v: string) {
    setHtml(v);
    onChange(sanitizeHtml(v));
  }

  const textLength = (editorRef.current?.textContent ?? "").length;
  const lengthTone =
    textLength > maxLength * 0.95
      ? "text-pink-600"
      : textLength > maxLength * 0.8
      ? "text-yellow-600"
      : "text-ink-400";

  // ═══════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
      {/* ─── Toolbar ─── */}
      <div className="border-b border-cream-200 bg-cream-50 px-2 py-2 overflow-x-auto">
        <div className="flex items-center gap-0.5 min-w-max">
          {/* Mode switch */}
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-cream-300 bg-white mr-2">
            <ModeBtn active={mode === "edit"} onClick={() => toggleMode("edit")} title="Edit">
              <Pencil className="h-3.5 w-3.5" />
            </ModeBtn>
            <ModeBtn active={mode === "preview"} onClick={() => toggleMode("preview")} title="Preview">
              <Eye className="h-3.5 w-3.5" />
            </ModeBtn>
            <ModeBtn active={mode === "html"} onClick={() => toggleMode("html")} title="HTML">
              <Code2 className="h-3.5 w-3.5" />
            </ModeBtn>
          </div>

          {mode === "edit" && (
            <>
              <ToolbarSep />
              <ToolbarBtn onClick={() => exec("undo")} title="Undo (Ctrl+Z)">
                <Undo className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => exec("redo")} title="Redo (Ctrl+Shift+Z)">
                <Redo className="h-3.5 w-3.5" />
              </ToolbarBtn>

              <ToolbarSep />
              <ToolbarBtn onClick={() => exec("bold")} title="Bold (Ctrl+B)">
                <Bold className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => exec("italic")} title="Italic (Ctrl+I)">
                <Italic className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => exec("underline")} title="Underline (Ctrl+U)">
                <UnderlineIcon className="h-3.5 w-3.5" />
              </ToolbarBtn>

              <ToolbarSep />
              <ToolbarBtn onClick={() => exec("formatBlock", "h2")} title="Heading 1">
                <Heading1 className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "h3")} title="Heading 2">
                <Heading2 className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "h4")} title="Heading 3">
                <Heading3 className="h-3.5 w-3.5" />
              </ToolbarBtn>

              <ToolbarSep />
              <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet list">
                <List className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => exec("insertOrderedList")} title="Numbered list">
                <ListOrdered className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "blockquote")} title="Quote">
                <Quote className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "pre")} title="Code block">
                <Code className="h-3.5 w-3.5" />
              </ToolbarBtn>

              <ToolbarSep />
              <ToolbarBtn onClick={openLinkDialog} title="Insert link (Ctrl+K)">
                <LinkIcon className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={openImageDialog} title="Insert image">
                <ImageIcon className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn onClick={openYoutubeDialog} title="Embed YouTube">
                <Video className="h-3.5 w-3.5" />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => exec("insertHTML", '<hr style="border:none;border-top:2px solid #F3E9D6;margin:1.25rem 0;" />')}
                title="Divider"
              >
                <Minus className="h-3.5 w-3.5" />
              </ToolbarBtn>
            </>
          )}

          <div className="flex-1" />

          {mode === "edit" && (
            <span className={cn("text-[10px] font-medium px-2", lengthTone)}>
              {textLength}/{maxLength}
            </span>
          )}
        </div>
      </div>

      {/* ─── Editor / Preview / HTML ─── */}
      <div className="relative">
        {mode === "edit" && (
          <>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              data-placeholder={placeholder}
              className={cn(
                "prose-editor px-4 py-3 text-sm text-ink-900 focus:outline-none overflow-y-auto",
                "empty:before:content-[attr(data-placeholder)] empty:before:text-ink-400 empty:before:pointer-events-none"
              )}
              style={{ minHeight }}
            />
            {focused && (
              <p className="absolute bottom-2 right-3 text-[10px] text-ink-400 bg-white/80 px-2 py-0.5 rounded">
                Use the toolbar or keyboard shortcuts
              </p>
            )}
          </>
        )}

        {mode === "preview" && (
          <div
            className="rich-preview px-4 py-3 overflow-y-auto"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{
              __html: html || `<p class="text-ink-400 text-sm">Nothing to preview yet.</p>`,
            }}
          />
        )}

        {mode === "html" && (
          <textarea
            value={html}
            onChange={(e) => handleHtmlChange(e.target.value)}
            spellCheck={false}
            className="w-full font-mono text-xs p-4 focus:outline-none resize-y"
            style={{ minHeight }}
          />
        )}
      </div>

      {/* ─── Dialogs ─── */}
      {linkDialog && (
        <SmallDialog
          title="Insert link"
          onClose={() => setLinkDialog(false)}
          onConfirm={insertLink}
          confirmLabel="Insert"
        >
          <label className="block text-xs font-medium text-ink-600 mb-1">URL</label>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            autoFocus
            className="w-full h-10 rounded-lg border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
          />
          <label className="block text-xs font-medium text-ink-600 mt-3 mb-1">
            Display text (optional)
          </label>
          <input
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="Click here"
            className="w-full h-10 rounded-lg border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
          />
        </SmallDialog>
      )}

      {imageDialog && (
        <SmallDialog
          title="Insert image"
          onClose={() => setImageDialog(false)}
          onConfirm={insertImage}
          confirmLabel="Insert"
        >
          <label className="block text-xs font-medium text-ink-600 mb-1">Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://res.cloudinary.com/..."
            autoFocus
            className="w-full h-10 rounded-lg border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
          />
          <label className="block text-xs font-medium text-ink-600 mt-3 mb-1">
            Alt text (for accessibility)
          </label>
          <input
            type="text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="Description of the image"
            className="w-full h-10 rounded-lg border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
          />
        </SmallDialog>
      )}

      {youtubeDialog && (
        <SmallDialog
          title="Embed YouTube video"
          onClose={() => setYoutubeDialog(false)}
          onConfirm={insertYoutube}
          confirmLabel="Embed"
        >
          <label className="block text-xs font-medium text-ink-600 mb-1">
            YouTube URL or video ID
          </label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            autoFocus
            className="w-full h-10 rounded-lg border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none"
          />
          <p className="text-[11px] text-ink-500 mt-2">
            Accepts full URLs or just the 11-character video ID.
          </p>
        </SmallDialog>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="h-8 w-8 rounded-md text-ink-600 hover:text-ink-900 hover:bg-white flex items-center justify-center transition-colors"
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <span className="w-px h-5 bg-cream-300 mx-1 shrink-0" />;
}

function ModeBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
        active ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-cream-100"
      )}
    >
      {children}
    </button>
  );
}

function SmallDialog({
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = "Save",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-ink-900/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg text-ink-500 hover:bg-cream-100 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div>{children}</div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:bg-cream-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  // Already an ID?
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2] || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}
