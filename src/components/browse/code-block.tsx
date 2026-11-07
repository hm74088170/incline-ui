import { CopyButton } from "./copy-button";

export function CodeBlock({ code, title }: { code: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <span className="truncate font-mono text-xs text-subtle">{title}</span>
        <CopyButton text={code} label="Copy code" />
      </div>
      <pre tabIndex={0} className="max-h-96 overflow-auto p-4 text-xs leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}