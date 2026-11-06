export default function Home() {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">InclineUI</h1>
      <p className="text-subtle">
        Customizable icons you can install and use. Search the sidebar and pick an icon to get
        started.
      </p>
      <code className="rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm">
        npx inclineui add arrow-left
      </code>
    </div>
  );
}