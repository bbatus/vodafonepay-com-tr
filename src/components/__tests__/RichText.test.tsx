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
});
