import type { ReactNode } from "react";
import { RichText as LexicalRichText, type JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";
import type { DefaultNodeTypes, SerializedHeadingNode } from "@payloadcms/richtext-lexical";
import { cn } from "@/lib/utils";

/**
 * The single renderer for all three CMS richText usages (BlogPosts.body,
 * Campaigns.body/terms, Pages' `richText` block) — see cms/payload.config.ts's
 * `editor` for the matching feature config. Typography (h2: 20px/regular
 * weight/#333, table cell borders #d9d9d9) was read off the live
 * vodafonepay.com.tr blog page's computed styles, not guessed.
 *
 * The colored "Vurgu" text state isn't part of Lexical's default JSX
 * converters (TextJSXConverter only handles bold/italic/underline/etc, not
 * textState) — the `text` override below reads the same `$.color` node-state
 * key the editor writes and re-applies its CSS on render.
 */

type StatefulTextNode = { $?: { color?: string } };

const VURGU_COLOR = "#e60000";

const converters: JSXConvertersFunction<DefaultNodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  text: (args) => {
    // `defaultConverters.text` is always a function at runtime (it comes
    // from the package's own converter map); the union type also allows a
    // static ReactNode for user-authored converters, which doesn't apply here.
    const rendered = (defaultConverters.text as (a: typeof args) => ReactNode)(args);
    const color = (args.node as unknown as StatefulTextNode).$?.color;
    if (color === "vurgu") {
      return (
        <span key={args.node.text} style={{ color: VURGU_COLOR }}>
          {rendered}
        </span>
      );
    }
    return rendered;
  },
  heading: ({ node, nodesToJSX }) => {
    const headingNode = node as SerializedHeadingNode;
    const children = nodesToJSX({ nodes: headingNode.children });
    const Tag = headingNode.tag;
    const classesByTag: Record<string, string> = {
      h2: "mt-8 mb-4 text-xl font-normal text-[#333] first:mt-0",
      h3: "mt-6 mb-3 text-lg font-normal text-[#333] first:mt-0",
      h4: "mt-6 mb-3 text-base font-medium text-[#333] first:mt-0",
    };
    return <Tag className={classesByTag[Tag] ?? "mt-6 mb-3 text-base font-medium text-[#333]"}>{children}</Tag>;
  },
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    if (!children?.length) return <p className="mb-4" />;
    return <p className="mb-4 text-base leading-6 text-[#333]">{children}</p>;
  },
  link: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    const rel = node.fields.newTab ? "noopener noreferrer" : undefined;
    const target = node.fields.newTab ? "_blank" : undefined;
    // Internal-doc linking is disabled in the editor (LinkFeature's
    // `enabledCollections: []`, cms/payload.config.ts) — every link here is
    // a custom URL.
    const href = node.fields.url ?? "";
    return (
      <a href={href} rel={rel} target={target} className="text-[#e60000] underline underline-offset-2 hover:no-underline">
        {children}
      </a>
    );
  },
  list: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    const Tag = node.tag;
    return (
      <Tag className={cn("mb-4 pl-5 text-base leading-6 text-[#333]", node.listType === "number" ? "list-decimal" : "list-disc")}>
        {children}
      </Tag>
    );
  },
  listitem: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    return <li className="mb-1">{children}</li>;
  },
  quote: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    return <blockquote className="mb-4 border-l-4 border-gray-300 pl-4 italic text-gray-600">{children}</blockquote>;
  },
  horizontalrule: () => <hr className="my-8 border-gray-200" />,
  upload: (args) => {
    const rendered = (defaultConverters.upload as (a: typeof args) => ReactNode)(args);
    if (!rendered) return null;
    return <span className="mb-4 block">{rendered}</span>;
  },
});

export function hasRichTextContent(data: unknown): boolean {
  const root = (data as { root?: { children?: unknown[] } } | null | undefined)?.root;
  return Boolean(root?.children?.length);
}

export function RichText({ data, className }: { data: unknown; className?: string }) {
  if (!hasRichTextContent(data)) return null;
  return (
    <LexicalRichText
      data={data as Parameters<typeof LexicalRichText>[0]["data"]}
      converters={converters}
      className={cn("lexical-richtext", className)}
    />
  );
}
