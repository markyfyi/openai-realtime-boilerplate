export function App({ content }: { content: string }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center text-8xl font-mono text-slate-700">
      {content}
    </div>
  );
}
