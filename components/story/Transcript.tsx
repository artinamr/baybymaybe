import { CHAPTERS, SOURCES, TRANSCRIPT, type SourceId } from "@/content/story";

const ORDER: SourceId[] = ["google", "hbr"];
const num = (id: SourceId) => ORDER.indexOf(id) + 1;

/**
 * THE STORY IN WORDS: everything the film shows and says, in order, with the
 * pictures described and the two facts cited. It is the page's text for
 * screen readers and search engines, and for anyone who would rather read.
 */
export function Transcript() {
  const story = CHAPTERS.filter((c) => c.id !== "end");
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
        <ol className="st-tr-list">
          {story.map((c) => (
            <li key={c.id} className="st-tr-ch" data-rv>
              <h3 className="st-tr-name">
                {c.kicker ? <span className="st-tr-k">{c.kicker}</span> : <span className="st-tr-k">{c.name}</span>}
                <span className="st-tr-t">{c.title}</span>
              </h3>
              <p className="st-tr-scene">{c.scene}</p>
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
            </li>
          ))}
        </ol>
        <p className="st-tr-note" data-rv>
          The counters in the film count the film’s own customers: how many it lost, and kept, while you watched. They
          are not a figure about your business.
        </p>
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
