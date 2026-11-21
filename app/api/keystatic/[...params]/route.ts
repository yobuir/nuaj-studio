/**
 * API used by the Keystatic editor (reading/writing content, GitHub sign-in).
 * Switched off on the live site until GitHub is connected — otherwise anyone
 * could write to the server's files.
 */
import { makeRouteHandler } from "@keystatic/next/route-handler";
import config, { keystaticMode } from "../../../../keystatic.config";

const off = () => new Response("Not found", { status: 404 });
const handler = keystaticMode() === "disabled" ? { GET: off, POST: off } : makeRouteHandler({ config });

export const GET = handler.GET;
export const POST = handler.POST;
