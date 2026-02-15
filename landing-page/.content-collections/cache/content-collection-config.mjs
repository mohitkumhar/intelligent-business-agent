// content-collections.ts
import {
  defineCollection,
  defineConfig,
  suppressDeprecatedWarnings
} from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationDiff
} from "@shikijs/transformers";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
suppressDeprecatedWarnings("legacySchema");
var posts = defineCollection({
  name: "posts",
  directory: "content",
  include: "**/*.mdx",
  schema: (z) => ({
    title: z.string(),
    description: z.string().optional(),
    postedAt: z.string().date().optional(),
    updatedAt: z.string().date().optional(),
    author: z.string(),
    cover: z.string().optional()
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document, {
      remarkPlugins: [remarkGfm, remarkRemoveMdxExtension],
      rehypePlugins: [
        rehypeSlug,
        [rehypePrettyCode, rehypePrettyCodeSettings],
        [rehypeAutolinkHeadings, rehypeAutolinkHeadingsSettings]
      ]
    });
    return {
      ...document,
      mdx
    };
  }
});
var content_collections_default = defineConfig({
  collections: [posts]
});
var rehypePrettyCodeSettings = {
  theme: "material-theme-palenight",
  defaultLang: {
    block: "md"
  },
  transformers: [
    transformerMetaHighlight(),
    transformerMetaWordHighlight(),
    transformerNotationDiff({
      matchAlgorithm: "v3"
    })
  ],
  onVisitLine(node) {
    if (node.children.length === 0) {
      node.children = [{ type: "text", value: " " }];
    }
  },
  onVisitHighlightedLine(node) {
    node.properties.className.push("line--highlighted");
  },
  onVisitHighlightedWord(node) {
    node.properties.className = ["word--highlighted"];
  }
};
var rehypeAutolinkHeadingsSettings = {
  properties: {
    className: ["subheading-anchor"],
    ariaLabel: "Link to section"
  }
};
var remarkRemoveMdxExtension = () => {
  return (tree) => {
    visit(tree, "link", (node) => {
      const url = node.url;
      if (typeof url === "string" && url.startsWith("./") && url.endsWith(".mdx")) {
        node.url = url.replace(/\.mdx$/, "");
      }
    });
  };
};
export {
  content_collections_default as default
};
