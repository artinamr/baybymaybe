import type { CSSProperties, ReactNode } from "react";
import { FrameLight } from "./FrameLight";
import "./crazy-demos.css";

/**
 * Device frames for the studio's demonstrations. The screen inside is a
 * size container, so a demo lays itself out for the frame it sits in: the
 * same component is the desktop view in a browser and the mobile view in a
 * phone. Addresses use the reserved `.example` domain: these are not real
 * businesses. A rim of light follows the pointer round each frame
 * (FrameLight); the frames rise into focus as they scroll in (crazy-demos.css).
 */
export function BrowserFrame({ url, children, label, style }: { url: string; children: ReactNode; label: string; style?: CSSProperties }) {
  return (
    <div className="dev-browser" role="group" aria-label={label} style={style}>
      <div className="dev-bar" aria-hidden>
        <span className="dev-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="dev-url">{url}</span>
      </div>
      <div className="dev-screen">{children}</div>
      <FrameLight />
    </div>
  );
}

export function PhoneFrame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="dev-phone" role="group" aria-label={label}>
      <div className="dev-phone-screen dev-screen">{children}</div>
      <FrameLight />
    </div>
  );
}
