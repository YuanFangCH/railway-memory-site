import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Returns the first public asset that exists on disk, otherwise the last
 * candidate (callers should provide a guaranteed fallback as the final item).
 *
 * Only call this from server components; it reads the filesystem at request
 * time so generated assets can be dropped into `public/images/generated/`
 * without a rebuild.
 */
export function pickAsset(candidates: readonly string[]): string {
  for (const candidate of candidates) {
    if (hasAsset(candidate)) {
      return candidate;
    }
  }
  return candidates[candidates.length - 1];
}

export function hasAsset(candidate: string): boolean {
  const relative = candidate.replace(/^\//, "");
  return existsSync(path.join(process.cwd(), "public", relative));
}
