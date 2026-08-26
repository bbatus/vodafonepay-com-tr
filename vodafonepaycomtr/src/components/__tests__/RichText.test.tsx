import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RichText, hasRichTextContent } from "@/components/RichText";

function lexicalDoc(children: unknown[]) {
  return { root: { type: "root", children, direction: null, format: "", indent: 0, version: 1 } };
}

function textNode(text: string, extra: Record<string, unknown> = {}) {
  return { type: "text", text, format: 0, detail: 0, mode: "normal", style: "", version: 1, ...extra };
}

function paragraph(children: unknown[]) {
  return { type: "paragraph", children, direction: null, format: "", indent: 0, version: 1 };
}

describe("hasRichTextContent", () => {
  it("is false for null/empty/malformed data", () => {
    expect(hasRichTextContent(null)).toBe(false);
    expect(hasRichTextContent(undefined)).toBe(false);
    expect(hasRichTextContent({})).toBe(false);
    expect(hasRichTextContent(lexicalDoc([]))).toBe(false);
  });

  it("is true when root has children", () => {
    expect(hasRichTextContent(lexicalDoc([paragraph([textNode("hello")])]))).toBe(true);
  });
});

describe("RichText", () => {
  it("renders nothing for empty content", () => {
    const { container } = render(<RichText data={lexicalDoc([])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a paragraph's text", () => {
    render(<RichText data={lexicalDoc([paragraph([textNode("Merhaba dünya")])])} />);
    expect(screen.getByText("Merhaba dünya")).toBeInTheDocument();
  });

  it("renders a heading with the h2 tag", () => {
    const heading = { type: "heading", tag: "h2", children: [textNode("Başlık")], direction: null, format: "", indent: 0, version: 1 };
    render(<RichText data={lexicalDoc([heading])} />);
    const el = screen.getByText("Başlık");
    expect(el.tagName).toBe("H2");
  });

  // Payload's TextStateFeature (cms/payload.config.ts) writes the chosen
  // state under Lexical's node-state key "$" — e.g. `{ "$": { color: "vurgu" } }`
  // on the text node. The default TextJSXConverter doesn't know about this
  // (it only handles bold/italic/underline/etc, not textState), so RichText's
  // own `text` converter override is what has to pick it up and apply the
  // fixed Vodafone-red color — this test is what would catch a regression if
  // that override were removed or the state key/value ever changed.
  it("applies the Vodafone-red Vurgu color to text carrying the 'vurgu' state", () => {
    const highlighted = textNode("Önemli", { $: { color: "vurgu" } });
    render(<RichText data={lexicalDoc([paragraph([highlighted])])} />);
    const el = screen.getByText("Önemli");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveStyle({ color: "rgb(230, 0, 0)" });
  });

  it("does not wrap plain text with no state in a colored span", () => {
    render(<RichText data={lexicalDoc([paragraph([textNode("Normal metin")])])} />);
    const el = screen.getByText("Normal metin");
    expect(el.tagName).not.toBe("SPAN");
  });

  // cms/payload.config.ts's UploadFeature adds a per-instance `width` select
  // (Küçük/Orta/Büyük/Tam Genişlik) — the `upload` converter override reads
  // `node.fields.width` and applies the matching max-width class.
  it("applies the small-width class to an upload node with width: small", () => {
    const uploadNode = {
      type: "upload",
      relationTo: "media",
      fields: { width: "small" },
      value: { url: "/img.jpg", alt: "test", mimeType: "image/png", width: 800, height: 600 },
      version: 1,
    };
    const { container } = render(<RichText data={lexicalDoc([uploadNode])} />);
    const wrapper = container.querySelector(".max-w-\\[280px\\]");
    expect(wrapper).not.toBeNull();
  });

  it("falls back to the large-width class when width is unset", () => {
    const uploadNode = {
      type: "upload",
      relationTo: "media",
      fields: {},
      value: { url: "/img.jpg", alt: "test", mimeType: "image/png", width: 800, height: 600 },
      version: 1,
    };
    const { container } = render(<RichText data={lexicalDoc([uploadNode])} />);
    expect(container.querySelector(".max-w-\\[720px\\]")).not.toBeNull();
  });

  // cms/payload.config.ts's BlocksFeature registers a `youtubeEmbed` block
  // (a single `youtubeUrl` text field) — the `blocks.youtubeEmbed` converter
  // parses the URL and renders an embeddable iframe.
  describe("youtubeEmbed block", () => {
    function youtubeBlock(youtubeUrl: string) {
      return { type: "block", id: "b1", fields: { blockType: "youtubeEmbed", youtubeUrl }, version: 1, format: "" };
    }

    it("renders an iframe with the extracted video ID for a watch URL", () => {
      const { container } = render(<RichText data={lexicalDoc([youtubeBlock("https://www.youtube.com/watch?v=dQw4w9WgXcQ")])} />);
      const iframe = container.querySelector("iframe");
      expect(iframe?.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    });

    it("also accepts a youtu.be short URL", () => {
      const { container } = render(<RichText data={lexicalDoc([youtubeBlock("https://youtu.be/dQw4w9WgXcQ")])} />);
      const iframe = container.querySelector("iframe");
      expect(iframe?.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    });

    it("renders nothing for a URL that isn't recognizable as YouTube", () => {
      const { container } = render(<RichText data={lexicalDoc([youtubeBlock("https://example.com/not-youtube")])} />);
      expect(container.querySelector("iframe")).toBeNull();
    });
  });

  describe("link converter", () => {
    function linkNode(fields: Record<string, unknown>, text = "Bağlantı") {
      return { type: "link", fields, children: [textNode(text)], direction: null, format: "", indent: 0, version: 1 };
    }

    it("renders a plain external URL link with target=_blank when newTab is set", () => {
      render(<RichText data={lexicalDoc([paragraph([linkNode({ url: "https://example.com", newTab: true })])])} />);
      const link = screen.getByText("Bağlantı").closest("a");
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("has no target/rel when newTab is unset", () => {
      render(<RichText data={lexicalDoc([paragraph([linkNode({ url: "https://example.com" })])])} />);
      const link = screen.getByText("Bağlantı").closest("a");
      expect(link).not.toHaveAttribute("target");
      expect(link).not.toHaveAttribute("rel");
    });

    it("resolves an internal document link to the collection's real site URL", () => {
      const internal = linkNode({
        linkType: "internal",
        doc: { relationTo: "campaigns", value: { slug: "yaz-kampanyasi" } },
      });
      render(<RichText data={lexicalDoc([paragraph([internal])])} />);
      const link = screen.getByText("Bağlantı").closest("a");
      expect(link).toHaveAttribute("href", "/kampanyalar/yaz-kampanyasi");
    });

    it("renders plain unstyled text (not a broken link) when the internal doc didn't populate", () => {
      const internal = linkNode({ linkType: "internal", doc: { relationTo: "campaigns", value: null } });
      render(<RichText data={lexicalDoc([paragraph([internal])])} />);
      const text = screen.getByText("Bağlantı");
      expect(text.closest("a")).toBeNull();
    });
  });

  it("renders a list with list items", () => {
    const list = {
      type: "list",
      tag: "ul",
      listType: "bullet",
      start: 1,
      children: [{ type: "listitem", value: 1, children: [textNode("Madde 1")], direction: null, format: "", indent: 0, version: 1 }],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    };
    render(<RichText data={lexicalDoc([list])} />);
    const item = screen.getByText("Madde 1");
    expect(item.closest("li")).not.toBeNull();
    expect(item.closest("ul")).not.toBeNull();
  });

  it("renders a numbered list with the list-decimal class", () => {
    const list = {
      type: "list",
      tag: "ol",
      listType: "number",
      start: 1,
      children: [{ type: "listitem", value: 1, children: [textNode("Madde 1")], direction: null, format: "", indent: 0, version: 1 }],
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    };
    const { container } = render(<RichText data={lexicalDoc([list])} />);
    expect(container.querySelector("ol.list-decimal")).not.toBeNull();
  });

  it("renders a quote as a blockquote", () => {
    const quote = { type: "quote", children: [textNode("Bir alıntı")], direction: null, format: "", indent: 0, version: 1 };
    render(<RichText data={lexicalDoc([quote])} />);
    expect(screen.getByText("Bir alıntı").closest("blockquote")).not.toBeNull();
  });

  it("renders a horizontal rule", () => {
    const hr = { type: "horizontalrule", version: 1 };
    const { container } = render(<RichText data={lexicalDoc([hr])} />);
    expect(container.querySelector("hr")).not.toBeNull();
  });

  it("renders an empty paragraph node without crashing", () => {
    // Lexical's own renderer skips a childless paragraph before reaching our
    // converter, so there's no <p> to assert on — this only guards against
    // the empty-children branch throwing.
    expect(() => render(<RichText data={lexicalDoc([paragraph([])])} />)).not.toThrow();
  });
});
