import ora from "ora";
import { Command } from '@commander-js/extra-typings';

export function epochToString(epoch: number) {
  const date = new Date(epoch * 1000);
  // return date.toLocaleString();
  return date.toISOString();
}

type GenericFieldType = Record<string, unknown>

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

interface Config {
  hiddenFields?: string[];
  loadingMessage?: string;
  successMessage?: string;
}

const defaultConfig = {
  hiddenFields: [],
  loadingMessage: "Loading",
  successMessage: "Success!",
};

export async function runCommand(
  func: (args?: any) => Promise<unknown>,
  program: Command,
  config: Config = {}) {

  config =  {...defaultConfig, ...config} as const;


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
      Array.isArray(result) ? console.table(result.map((item) => formatFields(item, config.hiddenFields))) : console.table(formatFields(result as GenericFieldType, config.hiddenFields));
    }
  } catch (error: any) {
    if (error?.message) {
      spinner.fail(error.message);
    }
  }
}
