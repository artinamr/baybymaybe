import type { ReactNode } from "react";
import "./blog.css";

/**
 * The blog's pages (the index, the articles, the glossary, how we write) load
 * their own stylesheet, so the rest of the site doesn't download or parse it
 * before its first paint. The page shell itself is each page's `Page`.
 */
export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
