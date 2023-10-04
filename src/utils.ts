import ora from "ora";
import { Command } from '@commander-js/extra-typings';
import { Config, GenericFieldType } from './types';

/**
 * Converts an epoch timestamp to an ISO string.
 * @param epoch - The epoch timestamp to convert.
 * @returns The ISO string representation of the epoch timestamp.
 */
export function epochToString(epoch: number) {
  const date = new Date(epoch * 1000);
  return date.toISOString();
}

/**
 * Formats the given fields object by removing hidden fields and converting date fields from epoch to string.
 * @param fields - The fields object to format.
 * @param additionalHiddenFields - An optional array of additional field names to hide.
 * @returns A new object with the formatted fields.
 */
function formatFields(fields: GenericFieldType, additionalHiddenFields: string[] = []): Record<string, unknown> {
  const DATE_FIELDS = ["created", "created_at", "finished_at", "last_updated"];
  const HIDDEN_FIELDS = ["permission", "parent", "hyperparameters", ...additionalHiddenFields];

  return Object.entries(fields).reduce((acc, [key, value]) => {
    if (HIDDEN_FIELDS.includes(key)) {
      return acc
    }

    if (DATE_FIELDS.includes(key) && typeof value === "number") {
      acc[key] = epochToString(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);
}

const defaultConfig = {
  hiddenFields: [],
  loadingMessage: "Loading",
  successMessage: "Success!",
};

/**
 * Runs a command and handles the result, displaying a spinner and logging the result to the console.
 * @param func - The function to run as the command.
 * @param program - The command program.
 * @param config - The configuration options for the command.
 */
export async function runCommand(
  program: Command,
  func: (args?: unknown) => Promise<unknown>,
  config: Config = {}) {

  config = { ...defaultConfig, ...config } as const;

  const opts = program.opts() as {
    raw?: boolean;
  };

  const spinner = ora(config.loadingMessage).start();

  try {
    let result = await func();

    if (result === undefined || result === null) {
      throw new Error("No result");
    }

    if (typeof result === 'object' && 'data' in result) {
      result = result.data;
    }

    spinner.succeed(config.successMessage);

    if (opts.raw) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      Array.isArray(result) ?
        console.table(result.map((item) => formatFields(item, config.hiddenFields))) :
        console.table(formatFields(result as GenericFieldType, config.hiddenFields));
    }
  } catch (error: unknown) {
    if (error instanceof Error && error?.message) {
      spinner.fail(error.message);
    }
  }
}

/**
 * Waits for a function to resolve to true, with a maximum number of tries and an initial delay.
 * @param func - The function to wait for.
 * @param maxTries - The maximum number of tries before giving up. Defaults to 5.
 * @param initialDelay - The initial delay in milliseconds before the first try. Defaults to 1000.
 * @throws An error if the function does not resolve to true after the maximum number of tries.
 */
export async function waitForTrue(func: () => Promise<boolean>, maxTries = 5, initialDelay = 1000): Promise<void> {
  let tries = 0;
  let delay = initialDelay;

  while (tries < maxTries) {
    await new Promise(resolve => setTimeout(resolve, delay));
    const result = await func();
    tries++;
    if (result) {
      return;
    }

    // Increase the delay for the next iteration
    delay *= 2;
  }

  throw new Error("Function did not resolve to true after maximum number of tries.");
}

/**
 * Returns a string with ANSI escape codes to display the text in red.
 * @param str - The input string to be colored in red.
 * @returns A string with ANSI escape codes to display the text in red.
 */
export function errorColor(str: string) {
  // Add ANSI escape codes to display text in red.
  return `\x1b[31m${str}\x1b[0m`;
}
