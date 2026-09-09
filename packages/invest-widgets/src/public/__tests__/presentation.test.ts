import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { OfferCard, ProfileSelector } from "../index";

describe("public investment presentation", () => {
  it("renders host-formatted offer data as text and emits its identity", async () => {
    const wrapper = mount(OfferCard, {
      props: {
        offer: {
          id: "offer-1",
          title: "<strong>Host title</strong>",
          description: "Host description",
          facts: [{ label: "Minimum", value: "€500" }],
        },
        actionLabel: "Read details",
      },
    });
    expect(wrapper.get("h2").text()).toBe("<strong>Host title</strong>");
    expect(wrapper.find("strong").exists()).toBe(false);
    expect(wrapper.get("dd").text()).toBe("€500");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("select")).toEqual([["offer-1"]]);
    expect(wrapper.find("a").exists()).toBe(false);
    wrapper.unmount();
  });

  it("keeps loading, empty and disabled offer states non-actionable", async () => {
    const wrapper = mount(OfferCard, {
      props: { loading: true, offer: { id: "1", title: "Stale offer" } },
    });
    expect(wrapper.get('[role="status"]').text()).toBe("Loading offer…");
    expect(wrapper.text()).not.toContain("Stale offer");
    expect(wrapper.find("button").exists()).toBe(false);
    await wrapper.setProps({
      loading: false,
      offer: undefined,
      emptyLabel: "Nothing to show",
    });
    expect(wrapper.get('[role="status"]').text()).toBe("Nothing to show");
    await wrapper.setProps({
      offer: { id: "1", title: "Offer" },
      disabled: true,
    });
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("select")).toBeUndefined();
    wrapper.unmount();
  });

  it("forwards explicit image accessibility and responsive inputs", () => {
    const wrapper = mount(OfferCard, {
      props: {
        offer: {
          id: "image",
          title: "Image offer",
          image: {
            src: "/small.png",
            srcset: "/large.png 1280w",
            sizes: "100vw",
            alt: "Host supplied description",
          },
        },
      },
    });
    expect(wrapper.get("img").attributes()).toMatchObject({
      src: "/small.png",
      srcset: "/large.png 1280w",
      sizes: "100vw",
      alt: "Host supplied description",
      loading: "lazy",
    });
    wrapper.unmount();
  });

  it("isolates two mounted applications and leaves selection controlled by the host", async () => {
    const first = mount(ProfileSelector, {
      props: {
        items: [{ id: "a", label: "First account" }],
        selectedId: undefined,
      },
    });
    const second = mount(ProfileSelector, {
      props: { items: [{ id: "b", label: "Second account" }], selectedId: "b" },
    });
    await first.get("button").trigger("click");
    expect(first.emitted("select")).toEqual([["a"]]);
    expect(first.get("button").attributes("aria-pressed")).toBe("false");
    expect(second.emitted("select")).toBeUndefined();
    expect(second.text()).not.toContain("First account");
    expect(second.get("button").attributes("aria-pressed")).toBe("true");
    await first.setProps({ selectedId: "a" });
    expect(first.get("button").attributes("aria-pressed")).toBe("true");
    first.unmount();
    second.unmount();
  });

  it("renders profile loading and empty states and suppresses disabled selection", async () => {
    const wrapper = mount(ProfileSelector, {
      props: { items: [{ id: "a", label: "Account", disabled: true }] },
    });
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("select")).toBeUndefined();
    await wrapper.setProps({ loading: true });
    expect(wrapper.get('[role="status"]').text()).toBe("Loading profiles…");
    expect(wrapper.find("button").exists()).toBe(false);
    await wrapper.setProps({
      loading: false,
      items: [],
      emptyLabel: "Create a profile first",
    });
    expect(wrapper.get('[role="status"]').text()).toBe(
      "Create a profile first",
    );
    wrapper.unmount();
  });
});
