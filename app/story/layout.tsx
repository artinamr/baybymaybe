import type { ReactNode } from "react";
import "./story.css";

/** The story loads its own stylesheet (the door, the film's words and controls, the transcript); no other page does. */
export default function StoryLayout({ children }: { children: ReactNode }) {
  return children;
}
