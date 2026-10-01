/** Keep the display face's fine punctuation readable at small sizes. */
export function WorkTitle({ text }: { text: string }) {
  return text.split(/([—-])/).map((part, i) =>
    part === "—" || part === "-" ? <span className="work-punctuation" key={i}>{part}</span> : part,
  );
}
