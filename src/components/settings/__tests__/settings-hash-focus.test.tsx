import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsHashFocus } from "@/components/settings/settings-hash-focus";

describe("settings hash focus", () => {
  let resizeCallback: ResizeObserverCallback | null;
  const disconnect = vi.fn();
  const observe = vi.fn();

  beforeEach(() => {
    resizeCallback = null;
    disconnect.mockClear();
    observe.mockClear();
    vi.useFakeTimers();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
      },
    );
    HTMLElement.prototype.scrollIntoView = vi.fn();
    window.history.replaceState(null, "", "#settings-providers");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it("keeps the deep-linked section stable while async content changes height", () => {
    const target = document.createElement("section");
    target.id = "settings-providers";
    target.tabIndex = -1;
    document.body.append(target);

    render(<SettingsHashFocus />);
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(observe).toHaveBeenCalledWith(target);

    act(() => resizeCallback?.([], {} as ResizeObserver));
    expect(target.scrollIntoView).toHaveBeenCalledTimes(2);
    expect(observe).toHaveBeenCalledWith(document.body);
  });

  it("stops automatic correction as soon as the customer starts navigating", () => {
    const target = document.createElement("section");
    target.id = "settings-providers";
    target.tabIndex = -1;
    document.body.append(target);

    render(<SettingsHashFocus />);
    window.dispatchEvent(new WheelEvent("wheel"));
    act(() => resizeCallback?.([], {} as ResizeObserver));

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalled();
  });

  it("keeps the retired provider hash working as a compatibility alias", () => {
    const target = document.createElement("section");
    target.id = "settings-providers";
    target.tabIndex = -1;
    document.body.append(target);
    window.history.replaceState(null, "", "#settings-providers-runtimes");

    render(<SettingsHashFocus />);

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("ignores malformed URL-encoded hashes without crashing", () => {
    window.history.replaceState(null, "", "#settings-%E0%A4%A");

    expect(() => render(<SettingsHashFocus />)).not.toThrow();
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
