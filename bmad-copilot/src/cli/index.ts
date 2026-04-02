/**
 * @fileoverview CLI Router for bmad-copilot-adapter.
 *
 * Parses command-line arguments and dispatches to the appropriate
 * command handler. Uses zero external dependencies — simple
 * `process.argv` parsing only.
 *
 * @module cli/index
 */

import { bootstrap } from './bootstrap.js';
import { update } from './update.js';
import { status } from './status.js';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const VERSION = require('../../package.json').version;

const HELP_TEXT = `
bmad-copilot-adapter v${VERSION}

USAGE
  npx bmad-copilot-adapter <command> [options]

COMMANDS
  bootstrap    Full setup: check Node, install prompts, install VS Code extension
  update       Rescan .github/prompts and rebuild command map
  status       Show BMAD installation health and diagnostics

OPTIONS
  --cwd <dir>  Override working directory (default: process.cwd())
  --yes, -y    Skip confirmation prompts
  --help, -h   Show this help message
  --version    Show version number

EXAMPLES
  npx bmad-copilot-adapter bootstrap
  npx bmad-copilot-adapter update
  npx bmad-copilot-adapter status --cwd /path/to/project
`.trim();

/* ------------------------------------------------------------------ */
/*  Argument parsing                                                  */
/* ------------------------------------------------------------------ */

interface ParsedArgs {
  command: string;
  cwd: string;
  yes: boolean;
  help: boolean;
  version: boolean;
}

/**
 * Parse command-line arguments from process.argv.
 *
 * @param argv - Raw command-line arguments array.
 * @returns Parsed arguments object.
 */
function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // Skip node + script path
  const result: ParsedArgs = {
    command: '',
    cwd: process.cwd(),
    yes: false,
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--version') {
      result.version = true;
    } else if (arg === '--yes' || arg === '-y') {
      result.yes = true;
    } else if (arg === '--cwd' && i + 1 < args.length) {
      result.cwd = args[++i];
    } else if (!arg.startsWith('-') && !result.command) {
      result.command = arg;
    }
  }

  return result;
}

/* ------------------------------------------------------------------ */
/*  Main                                                              */
/* ------------------------------------------------------------------ */

/**
 * CLI entry point — parses arguments and dispatches to command handlers.
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.version) {
    console.log(VERSION);
    process.exit(0);
  }

  if (args.help || !args.command) {
    console.log(HELP_TEXT);
    process.exit(args.help ? 0 : 1);
  }

  try {
    switch (args.command) {
      case 'bootstrap':
        await bootstrap({ cwd: args.cwd, yes: args.yes });
        break;
      case 'update':
        await update({ cwd: args.cwd });
        break;
      case 'status':
        await status({ cwd: args.cwd });
        break;
      default:
        console.error(`\x1b[31mUnknown command: ${args.command}\x1b[0m\n`);
        console.log(HELP_TEXT);
        process.exit(1);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\x1b[31m✖ ${msg}\x1b[0m`);
    process.exit(1);
  }
}

main();
