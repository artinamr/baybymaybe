import { RESTS, dwellAt, travelDuration } from "@/components/story/timeline";

const WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/**
 * The story film's length played straight through, the way its own autoplay
 * plays it (rest to rest at the film's pace, holding on each rest to read),
 * in whole minutes. Read by the server page only, so the story's timeline
 * never reaches the home page's scripts; it follows the film if its pace or
 * rests change.
 */
export function storyMinutes(): number {
  let ms = dwellAt(RESTS[0]) * 1000;
  for (let i = 0; i + 1 < RESTS.length; i++) ms += travelDuration(RESTS[i], RESTS[i + 1]) + dwellAt(RESTS[i + 1]) * 1000;
  return Math.max(1, Math.round(ms / 60000));
}

/** "five-minute" (words up to ten, as the site writes small numbers). */
export function minuteWords(n: number): string {
  return `${n <= WORDS.length ? WORDS[n - 1] : String(n)}-minute`;
}
