import { CHAPTERS, SOURCES, TRANSCRIPT, type SourceId } from "@/content/story";

const ORDER: SourceId[] = [...new Set(CHAPTERS.flatMap((chapter) => (chapter.fact ? [chapter.fact.source] : [])))];
const num = (id: SourceId) => ORDER.indexOf(id) + 1;

/**
 * THE STORY IN WORDS: everything the film shows and says, in order, with the
 * pictures described and its research cited. It is the page's text for
 * screen readers and search engines, and for anyone who would rather read.
 */
export function Transcript() {
  const story = CHAPTERS;
  return (
    <section id="transcript" className="st-tr" aria-labelledby="st-tr-h">
      <div className="st-tr-in">
        <header className="st-tr-head">
          <h2 id="st-tr-h" className="st-tr-title" data-rv>
            {TRANSCRIPT.title}
          </h2>
          <p className="st-tr-intro" data-rv>
            {TRANSCRIPT.intro}
          </p>
        </header>
        <p className="st-tr-note st-tr-note-first" data-rv>{TRANSCRIPT.note}</p>
        <nav className="st-tr-nav" aria-label="In the written story" data-rv>
          <a href="#st-chapter-open">One customer</a>
          <a href="#st-chapter-website">Where it slows down</a>
          <a href="#st-chapter-turn">The rebuild</a>
          <a href="#st-chapter-new-you">The evening</a>
        </nav>
        <ol className="st-tr-list">
          {story.map((c) => (
            <li key={c.id} id={`st-chapter-${c.id}`} className="st-tr-ch" data-rv>
              <h3 className="st-tr-name">
                {c.kicker ? <span className="st-tr-k">{c.kicker}</span> : <span className="st-tr-k">{c.name}</span>}
                <span className="st-tr-t">{c.title}</span>
              </h3>
              <div className="st-tr-copy">
              {c.line ? <p className="st-tr-line">{c.line}</p> : null}
              {c.fact ? (
                <p className="st-tr-fact">
                  {c.fact.text}{" "}
                  <a href={`#st-source-${num(c.fact.source)}`} className="st-tr-cite" aria-label={`Source ${num(c.fact.source)}`}>
                    [{num(c.fact.source)}]
                  </a>
                </p>
              ) : null}
              {c.beat ? <p className="st-tr-line">{c.beat}</p> : null}
              <details className="st-tr-description">
                <summary>Scene description</summary>
                <p className="st-tr-scene">{c.scene}</p>
              </details>
              </div>
            </li>
          ))}
        </ol>
        <section className="st-tr-sources" aria-labelledby="st-src-h" data-rv>
          <h3 id="st-src-h" className="st-tr-sh">
            {TRANSCRIPT.sources}
          </h3>
          <ol>
            {ORDER.map((id, i) => {
              const s = SOURCES[id];
              return (
                <li key={id} id={`st-source-${i + 1}`}>
                  {s.authors}, “{s.title}”, {s.publisher}, {s.date}.{" "}
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.url.replace(/^https:\/\//, "")}
                  </a>
                  . Checked {s.checked}.
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </section>
  );
}
