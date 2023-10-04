#!/usr/bin/env node
import "dotenv/config";

import fs from 'fs';
import figlet from 'figlet';
import ora from 'ora';
import OpenAI, { toFile } from 'openai';
import { Command } from '@commander-js/extra-typings';
import { storyToJsonl } from '@kenzic/story';
import { errorColor, runCommand, waitForTrue } from './utils';

// Only supports GPT 3.5 Turbo for now
const MODEL = "gpt-3.5-turbo";

/**
 * Retrieves the OpenAI API key from the environment variables.
 * @throws {Error} If the OPENAI_API_KEY environment variable is not set.
 * @returns {string} The OpenAI API key.
 */
const getOpenAIKey = () => {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  return key;
}

const openai = new OpenAI({
  apiKey: getOpenAIKey(),
});

const program = new Command();

const banner = figlet.textSync("PITCH", {
  font: "Univers",
});

const description = `
Description:
  CLI for interacting with the OpenAI API Fine-Tuning API.
`;

program
  .name('pitch')
  .version('0.0.1')
  .description(description)
  .addHelpText('before', banner)
  .option('--raw', 'display raw JSON output', false)
  .configureOutput({
    outputError: (str, write) => write(errorColor(str))
  })

const file = program.command('file');
const tune = program.command("tune");
const model = program.command("model");

program
  .command("convert <filepath>")
  .action(async (filepath: string) => {
    const plainText = fs.readFileSync(filepath, 'utf8')
    const jsonlOutput = storyToJsonl(plainText);

    console.log(jsonlOutput);
  });

program
  .command("start <filepath>")
  .addHelpText('before', `
Start fine-tuning process:
- Convert story file to JSONL (if needed)
- Upload JSONL file to OpenAI
- Start fine-tuning job
`)
  .option('-f, --format <format>', 'which format to use', 'jsonl')
  .action(async (filepath, options) => {
    // get story file
    let plainText = fs.readFileSync(filepath, 'utf8');

    // convert the story file to JSONL
    if (options.format === 'story') {
      plainText = storyToJsonl(plainText);
    }

    const spinner = ora('Uploading File').start();
    // upload file
    const response = await openai.files.create({
      file: await toFile(Buffer.from(plainText), "input.jsonl"),
      purpose: 'fine-tune'
    });

    spinner.text = 'Processing File';

    await waitForTrue(async () => {
      const retrievedFile = await openai.files.retrieve(response.id);
      return retrievedFile.status === "processed";
    });

    spinner.text = 'Starting Fine-Tuning';

    const job = await openai.fineTuning.jobs.create({
      training_file: response.id,
      model: MODEL
    });

    spinner.succeed("Fine-Tuning Job Kicked Off");

    console.table(job);

  }).addHelpText('after', `
Examples:
  $ pitch start input.jsonl
  $ pitch start -f story input.story
  `);

/**
 * ==============================================
 * File CLI Commands
 * ==============================================
 */
file
  .command("upload <filepath>")
  .description("upload file")
  .action(async (filepath) => {
    const response = await openai.files.create({
      file: fs.createReadStream(filepath), purpose: 'fine-tune'
    });

    console.table(response);
  });

file
  .command("delete <fileId>")
  .description("delete file")
  .action(async (fileId) => {
    const response = await openai.files.del(fileId);

    console.table(response);
  })

file
  .command("list")
  .description("list files in your account")
  .action(async () => {
    const response = await openai.files.list();

    console.table(response.data);
  });

file
  .command("retrieve <fileId>")
  .option('-c, --contents', 'retrieve contents', false)
  .action(async (fileId: string, options: { contents: boolean }) => {
    if (options.contents) {
      const response = await openai.files.retrieveContent(fileId);

      console.log(response);
    } else {
      const response = await openai.files.retrieve(fileId);

      console.table(response);
    }
  });

/**
 * ==============================================
 * Fine-Tuning CLI Commands
 * ==============================================
 */
tune
  .command("status <jobId>")
  .description("get status of job")
  .action(async (jobId) => {
    return runCommand(async () => {
      return openai.fineTuning.jobs.retrieve(jobId);
    }, program, {
      loadingMessage: "List Jobs",
      successMessage: "Jobs Listed"
    });
  });

tune
  .command("create <fileId>")
  .description("create fine-tune job")
  .action(async (fileId) => {
    const result = await openai.fineTuning.jobs.create({
      training_file: fileId,
      model: MODEL
    });

    console.table(result);
  });

tune
  .command("list")
  .description("list jobs")
  .action(async () => {
    return runCommand(async () => {
      return openai.fineTuning.jobs.list();
    }, program, {
      hiddenFields: ["fine_tuned_model", "object", "validation_file", "error", "trained_tokens", "organization_id", "model", "result_files", "training_file"],
      loadingMessage: "List Jobs",
      successMessage: "Retrieved Jobs"
    });
  });

tune
  .command("retrieve <jobId>")
  .action(async (jobId) => {
    return runCommand(async () => {
      return openai.fineTuning.jobs.retrieve(jobId);
    }, program, {
      successMessage: "Retrieved Job",
      loadingMessage: "Retrieving Job"
    });
  });

/**
 * ==============================================
 * Model CLI Commands
 * ==============================================
 */
model
  .command("list")
  .description("list models")
  .action(async () => {
    return runCommand(async () => {
      return openai.models.list();
    }, program, {
      loadingMessage: "Retrieving Models",
      successMessage: "Models Retrieved"
    });
  });

model
  .command("retrieve <modelId>")
  .description("retrieve model")
  .action(async (modelId: string) => {
    return runCommand(async () => {
      return openai.models.retrieve(modelId);
    }, program, {
      loadingMessage: "Retrieving Model",
      successMessage: "Model Retrieved"
    });
  });

model
  .command("delete <modelId>")
  .description("delete model")
  .action(async (modelId: string) => {
    return runCommand(async () => {
      return openai.models.del(modelId);
    }, program, {
      loadingMessage: "Deleting Model",
      successMessage: "Model Deleted"
    });
  });

program.parse(process.argv);
