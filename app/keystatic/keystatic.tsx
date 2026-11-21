"use client";
/** The Keystatic editor UI. Configuration lives in /keystatic.config.ts. */
import { makePage } from "@keystatic/next/ui/app";
import config from "../../keystatic.config";

export default makePage(config);
