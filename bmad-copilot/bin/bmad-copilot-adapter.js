#!/usr/bin/env node
// @ts-check
"use strict";

/**
 * CLI entry point for bmad-copilot-adapter.
 *
 * Commands:
 *   bootstrap  — Full setup: check Node, install prompts, install extension
 *   update     — Rescan prompts and rebuild command map
 *   status     — Show installation health
 *
 * Usage:
 *   npx bmad-copilot-adapter bootstrap
 *   npx bmad-copilot-adapter update
 *   npx bmad-copilot-adapter status
 */

require("../dist/cli/index.js");
