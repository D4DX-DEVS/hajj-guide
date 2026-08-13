import { useEffect, useRef } from 'react';
import { FiLink } from 'react-icons/fi';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  dir?: 'ltr' | 'rtl' | 'auto';
  rows?: number;
  placeholder?: string;
}

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'A', 'BR', 'P', 'DIV']);
const ALLOWED_ATTRS: Record<string, string[]> = { A: ['href'] };

/**
 * Whitelist-sanitizes HTML so pasted content (or anything else that ends up in the
 * contentEditable DOM) can't smuggle scripts/handlers into a stored description —
 * this HTML is later rendered with dangerouslySetInnerHTML in list previews and the app.
 */
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style').forEach((n) => n.remove());

  function clean(node: ParentNode) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.parentNode?.removeChild(child);
        return;
      }
      const el = child as HTMLElement;
      clean(el); // sanitize descendants first, so nodes promoted by unwrapping below are already safe
      if (!ALLOWED_TAGS.has(el.tagName)) {
        while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
        el.remove();
        return;
      }
      [...el.attributes].forEach((attr) => {
        if (!(ALLOWED_ATTRS[el.tagName] || []).includes(attr.name)) el.removeAttribute(attr.name);
      });
      if (el.tagName === 'A') {
        const href = el.getAttribute('href') || '';
        if (!/^(https?:|mailto:)/i.test(href)) el.removeAttribute('href');
      }
    });
  }

  clean(doc.body);
  return doc.body.innerHTML;
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const TOOLBAR: { cmd: string; label: string; glyph: string; className?: string }[] = [
  { cmd: 'bold', label: 'Bold', glyph: 'B', className: 'font-bold' },
  { cmd: 'italic', label: 'Italic', glyph: 'I', className: 'italic' },
  { cmd: 'underline', label: 'Underline', glyph: 'U', className: 'underline' },
  { cmd: 'insertUnorderedList', label: 'Bullet list', glyph: '•' },
  { cmd: 'insertOrderedList', label: 'Numbered list', glyph: '1.' },
];

/** Lightweight WYSIWYG editor (bold/italic/underline/lists/link) storing raw HTML — no external dependency. */
export default function RichTextEditor({ value, onChange, dir = 'auto', rows = 4, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(value);

  // Only push `value` into the DOM when it changed from outside (e.g. form reset on load) —
  // never while the user is actively typing, or the caret would jump to the start on every keystroke.
  useEffect(() => {
    if (ref.current && value !== lastEmitted.current) {
      ref.current.innerHTML = value || '';
      lastEmitted.current = value;
    }
  }, [value]);

  const emit = () => {
    const html = ref.current?.innerHTML || '';
    lastEmitted.current = html;
    onChange(html);
  };

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const handleLink = () => {
    const url = window.prompt('Link URL (https://...)');
    if (!url) return;
    exec('createLink', url);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const safe = html ? sanitizeHtml(html) : escapeHtml(e.clipboardData.getData('text/plain'));
    exec('insertHTML', safe);
  };

  const handleBlur = () => {
    if (!ref.current) return;
    const clean = sanitizeHtml(ref.current.innerHTML);
    if (clean !== ref.current.innerHTML) ref.current.innerHTML = clean;
    emit();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition-shadow focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30">
      <div className="flex flex-wrap gap-0.5 border-b border-slate-200 bg-slate-50 p-1">
        {TOOLBAR.map((btn) => (
          <button
            key={btn.cmd}
            type="button"
            title={btn.label}
            className={`min-w-[26px] rounded px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-200 ${btn.className || ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(btn.cmd)}
          >
            {btn.glyph}
          </button>
        ))}
        <button
          type="button"
          title="Link"
          className="rounded px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-200"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleLink}
        >
          <FiLink size={13} />
        </button>
      </div>
      <div
        ref={ref}
        className="rte-editable px-3 py-2 text-sm focus:outline-none"
        style={{ minHeight: `${rows * 1.5}em` }}
        contentEditable
        dir={dir}
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={handleBlur}
        onPaste={handlePaste}
        suppressContentEditableWarning
      />
    </div>
  );
}
