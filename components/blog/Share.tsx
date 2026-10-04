"use client";

import { useState } from "react";

/**
 * Pass it on: copy the article's address, share it on LinkedIn, or email it.
 * Plain links, no share scripts and no tracking. `url` is the canonical address.
 */
export function Share({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this address:", url);
    }
  };
  const u = encodeURIComponent(url);
  return (
    <div className="ar-share" role="group" aria-label="Share this article">
      <p className="ar-share-h">Found it useful? Pass it on.</p>
      <div className="ar-share-row">
        <button type="button" className="ar-share-b" onClick={copy}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M9.5 14.5l5-5M10.6 6.6l1.6-1.6a4 4 0 015.7 5.7l-1.6 1.6M13.4 17.4l-1.6 1.6a4 4 0 01-5.7-5.7l1.6-1.6" />
          </svg>
          <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
        </button>
        <a className="ar-share-b" href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M6.5 9.5v8M6.5 6.5v.01M10.5 17.5v-8M10.5 13a3 3 0 016 0v4.5" />
          </svg>
          <span>LinkedIn</span>
        </a>
        <a className="ar-share-b" href={`mailto:?subject=${encodeURIComponent(title)}&body=${u}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" />
          </svg>
          <span>Email</span>
        </a>
      </div>
    </div>
  );
}
