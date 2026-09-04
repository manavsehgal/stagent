import { readFile } from "fs/promises";
import type { ProcessorResult } from "../registry";

const SUPPORTED_FORMATS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

/** Extract image dimensions metadata — agents use the file path to view images */
export async function processImage(filePath: string): Promise<ProcessorResult> {
  // sharp rather than image-size: it is already a dependency, and every
  // published image-size version carries unfixed parser DoS advisories.
  const sharp = (await import("sharp")).default;
  const buffer = await readFile(filePath);
  const metadata = await sharp(buffer).metadata();
  const format = metadata.format;

  if (format && !SUPPORTED_FORMATS.has(format)) {
    throw new Error(`Unsupported image format: ${format}`);
  }

  const meta = [
    `Image: ${metadata.width}x${metadata.height}`,
    `Format: ${format}`,
  ].join("\n");
  return { extractedText: meta };
}
