import CodeBlock from './CodeBlock.jsx';

// Minimal markup for question data: `inline code`, **bold**, blank-line
// paragraphs, "- " bullet lists, and ```lang fenced code blocks.

const FENCE = /```(\w+)?\n([\s\S]*?)\n?```/g;
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*)/g;

export function InlineText({ text }) {
  return text.split(INLINE).map((part, i) => {
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function Lines({ text }) {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <span key={i}>
      <InlineText text={line} />
      {i < lines.length - 1 && <br />}
    </span>
  ));
}

function Paragraphs({ text }) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, i) => {
      const lines = block.split('\n');
      if (lines.length === 1 && block.startsWith('## ')) {
        return (
          <h2 key={i} className="rich-heading">
            <InlineText text={block.slice(3)} />
          </h2>
        );
      }
      if (lines.every((line) => line.startsWith('- '))) {
        return (
          <ul key={i}>
            {lines.map((line, j) => (
              <li key={j}>
                <InlineText text={line.slice(2)} />
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={i}>
          <Lines text={block} />
        </p>
      );
    });
}

export default function RichText({ text, className = '' }) {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(FENCE)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ code: match[2], lang: match[1] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });

  return (
    <div className={`rich ${className}`}>
      {parts.map((part, i) =>
        part.code !== undefined ? (
          <CodeBlock key={i} code={part.code} lang={part.lang} />
        ) : (
          <Paragraphs key={i} text={part.text} />
        ),
      )}
    </div>
  );
}
