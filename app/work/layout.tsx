import type { ReactNode } from "react";
import "./work.css";

/** The work pages load their own stylesheet (the concept websites' case studies, the index's grid); the rest of the site doesn't. */
export default function WorkLayout({ children }: { children: ReactNode }) {
  return children;
}
