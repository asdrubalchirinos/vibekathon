import ReactMarkdown from "react-markdown";

export function Markdown({ text }: { text: string }) {
  if (!text.trim()) {
    return <p className="text-[var(--muted)]">Sin descripción todavía.</p>;
  }

  return (
    <div className="prose-simple max-w-none">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
