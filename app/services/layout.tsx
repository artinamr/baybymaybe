import type { ReactNode } from "react";
import "./services.css";

/** The services pages load their own stylesheet (the journey, the chooser, at a glance); the rest of the site doesn't. */
export default function ServicesLayout({ children }: { children: ReactNode }) {
  return children;
}
