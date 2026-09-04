import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { processImage } from "../image";

/**
 * Dimension reading moved from image-size to sharp: every published
 * image-size version carries unfixed parser DoS advisories, and sharp was
 * already a dependency. These fixtures pin the behavior that move had to
 * preserve — supported formats are read, a valid but unsupported format is
 * still refused, and undecodable data still throws.
 */
let dir: string;

beforeAll(async () => {
  const sharp = (await import("sharp")).default;
  dir = mkdtempSync(join(tmpdir(), "relay-image-processor-"));
  const base = () =>
    sharp({ create: { width: 64, height: 32, channels: 3, background: { r: 9, g: 9, b: 9 } } });
  writeFileSync(join(dir, "a.png"), await base().png().toBuffer());
  writeFileSync(join(dir, "b.jpg"), await base().jpeg().toBuffer());
  writeFileSync(join(dir, "c.gif"), await base().gif().toBuffer());
  writeFileSync(join(dir, "d.webp"), await base().webp().toBuffer());
  writeFileSync(join(dir, "e.tiff"), await base().tiff().toBuffer());
  writeFileSync(join(dir, "f.bin"), Buffer.from("definitely not an image"));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("processImage", () => {
  it("reports dimensions for every supported format", async () => {
    for (const file of ["a.png", "b.jpg", "c.gif", "d.webp"]) {
      const result = await processImage(join(dir, file));
      expect(result.extractedText).toContain("Image: 64x32");
    }
  });

  it("names the format sharp reports", async () => {
    expect((await processImage(join(dir, "a.png"))).extractedText).toContain("Format: png");
    // sharp reports "jpeg" where image-size reported "jpg". Both are in
    // SUPPORTED_FORMATS, so acceptance is unchanged; only the label differs.
    expect((await processImage(join(dir, "b.jpg"))).extractedText).toContain("Format: jpeg");
  });

  it("refuses a decodable image in an unsupported format", async () => {
    await expect(processImage(join(dir, "e.tiff"))).rejects.toThrow(/Unsupported image format/);
  });

  it("throws when the file is not a decodable image", async () => {
    await expect(processImage(join(dir, "f.bin"))).rejects.toThrow();
  });
});
