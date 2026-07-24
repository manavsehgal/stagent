import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";

import { PrimaryNavigation } from "@/components/shell/primary-navigation";

function TestLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

function ResponsiveHeader() {
  return (
    <div className="flex h-14 w-full items-center gap-3 px-4">
      <span className="hidden shrink-0 sm:block">Relay</span>
      <PrimaryNavigation activeId="home" LinkComponent={TestLink} />
      <span className="h-8 w-8 shrink-0" aria-hidden />
    </div>
  );
}

let root: Root | null = null;

afterEach(() => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
});

describe("AppBar responsive geometry", () => {
  it("keeps primary navigation usable at 390px", async () => {
    await page.viewport(390, 844);
    const mount = document.createElement("div");
    document.body.append(mount);
    root = createRoot(mount);
    root.render(<ResponsiveHeader />);

    const primary = page.getByRole("tablist", { name: "Primary" });
    await expect.element(primary).toBeVisible();
    for (const name of ["Home", "Packs", "Compose", "Data", "Observe"]) {
      await expect.element(page.getByRole("tab", { name })).toBeVisible();
    }

    const bounds = primary.element().getBoundingClientRect();
    expect(bounds.width).toBeGreaterThanOrEqual(180);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  });

  it("restores descriptive labels on a desktop viewport", async () => {
    await page.viewport(1280, 800);
    const mount = document.createElement("div");
    document.body.append(mount);
    root = createRoot(mount);
    root.render(<ResponsiveHeader />);

    const home = page.getByRole("tab", { name: "Home" });
    await expect.element(home).toBeVisible();
    expect(home.element().textContent).toContain("Home");
  });
});
