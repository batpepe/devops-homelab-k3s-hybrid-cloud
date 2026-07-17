export default function SectionHeader({ tag, title, intro }: { tag: string; title: string; intro?: string }) {
  return (
    <div className="mb-10">
      <p className="font-mono text-sm text-cyan mb-2">
        <span className="text-faint"># </span>
        {tag}
      </p>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">{title}</h2>
      {intro ? <p className="mt-3 max-w-2xl text-sub">{intro}</p> : null}
    </div>
  );
}
