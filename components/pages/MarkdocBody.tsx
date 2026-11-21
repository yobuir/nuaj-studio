/** Renders a journal post body written in the Keystatic editor. */
import React from "react";
import Markdoc, { type RenderableTreeNode } from "@markdoc/markdoc";

export default function MarkdocBody({ content }: { content: RenderableTreeNode }) {
  return <>{Markdoc.renderers.react(content, React)}</>;
}
