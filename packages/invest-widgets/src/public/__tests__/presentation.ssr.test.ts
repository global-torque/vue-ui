// @vitest-environment node
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";
import { OfferCard, ProfileSelector } from "../index";

describe("public widgets without browser globals or providers", () => {
  it("renders independent concurrent server requests without leaking profile state", async () => {
    expect(typeof window).toBe("undefined");
    const render = (id: string) =>
      renderToString(
        createSSRApp({
          render: () =>
            h(ProfileSelector, {
              items: [{ id, label: `Account ${id}` }],
              selectedId: id,
            }),
        }),
      );
    const [first, second] = await Promise.all([
      render("first"),
      render("second"),
    ]);
    expect(first).toContain("Account first");
    expect(first).not.toContain("Account second");
    expect(second).toContain("Account second");
    expect(second).not.toContain("Account first");
    expect(first).toContain('aria-pressed="true"');
  });

  it("server-renders an offer and public image without private runtime installation", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(OfferCard, {
            offer: {
              id: "one",
              title: "Public offer",
              image: { src: "/offer.png", alt: "Offer illustration" },
            },
          }),
      }),
    );
    expect(html).toContain("Public offer");
    expect(html).toContain("Offer illustration");
    expect(html).toContain("View offer");
  });
});
