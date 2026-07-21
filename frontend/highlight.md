# Markdown & Syntax Highlighting — Full Change Log

## Files Changed & What Code Was Added

---

### `src/components/SettingsPopup.tsx`

**1. Portal rendering** — Escape sidebar DOM constraints
```tsx
import { createPortal } from "react-dom";

// return (...) → return createPortal(..., document.body)
```

**2. Overlay classes** — Mobile-first with `lg:` breakpoint (matching search popup)
```tsx
// Outer overlay
className="fixed inset-0 z-[100] bg-white dark:bg-[#1e1e1e] lg:bg-black/30 dark:lg:bg-white/10 lg:flex lg:items-center lg:justify-center"

// Inner container
className="relative flex bg-white dark:bg-[#1e1e1e] h-full w-full overflow-hidden lg:rounded-xl lg:w-[840px] lg:max-w-[90vw] lg:h-[560px] lg:max-h-[85vh] lg:shadow-2xl"
```

**3. Top bar** — Removed back button, Settings title on left
```tsx
// Old: ArrowLeft + Back | Settings (center) | X
// New: Settings (left) | X (right)
<div className="flex items-center justify-between px-4 py-3 border-b ...">
  <span className="text-sm font-semibold ...">Settings</span>
  <button onClick={() => onOpenChange(false)}><X size={18} /></button>
</div>
```

**4. Layout toggles** — `sm:` → `lg:` breakpoint
```tsx
// Mobile layout: visible by default, hidden on desktop
className="flex flex-col w-full h-full lg:hidden"

// Desktop sidebar: hidden by default, flex on lg+
className="hidden lg:flex lg:flex-col w-56 ..."

// Desktop content: hidden by default, flex on lg+
className="hidden lg:flex lg:flex-col flex-1 ..."

// Close button: hidden on mobile, visible on desktop
className="absolute top-3 right-3 ... hidden lg:block"
```

---

### `src/components/sidebar/SidebarFooter.tsx`

**Menu reorder & color fix**
```tsx
// Imports added: Palette, User

// Menu order (top → bottom):
// 1. Upgrade Plan     ← color changed from amber to default (text-gray-700)
// 2. Personalization   ← opens settings with personalization tab
// 3. Profile           ← opens settings with profile tab
// 4. Settings          ← opens settings with general tab
// ――― divider ―――
// 5. Logout            ← red color (unchanged)
```

---

### `src/components/Message.tsx` (most changes)

**Imports**
```tsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { FiCopy, FiCheck } from "react-icons/fi";
import { LuPencilLine } from "react-icons/lu";
```

**CodeBlock component** (new)
```tsx
const CodeBlock = ({ code, lang }: { code: string; lang: string }) => {
  const resolvedLang = LANG_MAP[lang] || lang;
  let html: string;
  try {
    if (hljs.getLanguage(resolvedLang)) {
      html = hljs.highlight(code, { language: resolvedLang }).value;
    } else {
      html = hljs.highlightAuto(code).value;
    }
  } catch { html = code; }
  return <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />;
};
```

**Language alias map** (new)
```tsx
const LANG_MAP: Record<string, string> = {
  js: "javascript", ts: "typescript", py: "python",
  rb: "ruby", rs: "rust", sh: "bash", yml: "yaml",
  md: "markdown", kt: "kotlin", // ... 30+ mappings
};
```

**Custom markdown components** (via `useMemo`)
```tsx
const markdownComponents = useMemo(() => ({
  code({ className, children }) { /* block code with header+copy / inline code */ },
  pre({ children }) { return <>{children}</>; },
  p({ children }) { return <p className="my-2 leading-7 ...">{children}</p>; },
  h1({ children }) { return <h1 className="text-2xl font-bold mt-6 mb-3 pb-2 border-b ...">{children}</h1>; },
  h2({ children }) { return <h2 className="text-xl font-semibold mt-5 mb-2 pb-1 border-b ...">{children}</h2>; },
  h3({ children }) { return <h3 className="text-lg font-semibold mt-4 mb-2 ...">{children}</h3>; },
  ul({ children }) { return <ul className="list-disc pl-6 my-2 space-y-1.5 ...">{children}</ul>; },
  ol({ children }) { return <ol className="list-decimal pl-6 my-2 space-y-1.5 ...">{children}</ol>; },
  li({ children }) { return <li className="leading-7 ...">{children}</li>; },
  blockquote({ children }) { return <blockquote className="border-l-4 border-[#48A4FF] pl-4 my-3 py-1 bg-[#48A4FF]/5 ...">{children}</blockquote>; },
  table({ children }) { return <div className="my-3 overflow-x-auto rounded-lg border ..."><table ...>{children}</table></div>; },
  thead({ children }) { return <thead className="bg-gray-100 ...">{children}</thead>; },
  tbody({ children }) { return <tbody className="divide-y ...">{children}</tbody>; },
  tr({ children }) { return <tr className="hover:bg-gray-50 ...">{children}</tr>; },
  th({ children }) { return <th className="px-4 py-2.5 text-left font-semibold ...">{children}</th>; },
  td({ children }) { return <td className="px-4 py-2.5 ...">{children}</td>; },
  a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#48A4FF] hover:underline ...">{children}</a>; },
  hr() { return <hr className="my-4 border-gray-300 ..." />; },
}), [codeCopiedId, handleCodeCopy]);
```

**Markdown usage**
```tsx
// Old: <Markdown>{msg.content}</Markdown>
// New:
<Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
  {msg.content}
</Markdown>
```

**Inline edit buttons** — Changed to rounded-full, no icons
```tsx
<button className="px-4 py-1.5 rounded-full text-sm bg-gray-200 ...">Cancel</button>
<button className="px-4 py-1.5 rounded-full text-sm bg-blue-500 text-white ...">Send</button>
```

**Inline edit container** — Border wraps textarea + buttons
```tsx
<div className="flex flex-col rounded-xl bg-white dark:bg-[#1a1a1a] border ... focus-within:ring-2 ...">
  <textarea className="w-full ... bg-transparent ..." />
  <div className="flex items-center justify-end gap-1.5 px-3 pb-2">
    <button>Cancel</button>
    <button>Send</button>
  </div>
</div>
```

**Edit/Copy buttons** — Moved outside message bubble, always visible
```tsx
{showActions && (
  <div className="flex items-center gap-1 mt-2">
    <button onClick={handleCopy} title="Copy">
      {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
    </button>
    <button onClick={() => setIsEditing(true)} title="Edit">
      <LuPencilLine size={16} />
    </button>
  </div>
)}
```

**Copy behavior** — Shows checkmark for 2 seconds
```tsx
const [copied, setCopied] = useState(false);
const handleCopy = async () => {
  await navigator.clipboard.writeText(msg.content);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};
```

**Outer container** — Changed from `flex justify-end` to `flex flex-col items-end/items-start` (for actions below bubble)
```tsx
<div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
```

**Removed** — `Prism.highlightAll()` useEffect, `.reset-tw` class, floating pencil button, `group` class

---

### `src/components/ContentArea.tsx`

```tsx
// Increased gap between messages
className="flex flex-col space-y-4 w-full ..."
//                               ^^^^^^^^ was space-y-2
```

---

### `src/index.css`

```css
/* Removed */
.reset-tw :not(pre):not(code) { all: revert; }
.reset-tw h1, .reset-tw h2, ... { font-weight: 400 !important; }
.reset-tw p, .reset-tw li, .reset-tw blockquote { line-height: 1.8 !important; margin: 6px !important; }

/* Added */
.list-circle { list-style-type: circle; }
.list-square { list-style-type: square; }
```

---

### `src/assets/prism.css`

Replaced entire file content with Atom One Dark theme from highlight.js.

```css
/* Now contains: highlight.js Atom One Dark theme */
/* Copied from node_modules/highlight.js/styles/atom-one-dark.css */
```

---

### `src/components/ui/ChatInput.tsx`

```tsx
// Container border-radius
className="relative w-full rounded-full border ..."
//                               ^^^^^^^^^^^^ was rounded-xl
```

---

### `package.json` — New dependencies

```json
"highlight.js": "^11.x",
"remark-gfm": "^4.x"
```

---

## Summary of Unchanged Files

These files were **not modified**:
- `src/pages/Home.tsx` — Search popup (unchanged)
- `src/components/Sidebar.tsx` — Sidebar layout
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/ChatInput.tsx` (only ChatInput.tsx changed, not others)
- `src/features/chat/chatSlice.ts`
- `src/types/chat.ts`
