#!/usr/bin/env node
require('dotenv').config();

import fs from 'fs';
import figlet from 'figlet';
import OpenAI, { toFile } from 'openai';
import { Command } from '@commander-js/extra-typings';
import { storyToJsonl } from '@kenzic/story';

const MODEL = "gpt-3.5-turbo";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"]
});

const program = new Command();

function errorColor(str: string) {
  // Add ANSI escape codes to display text in red.
  return `\x1b[31m${str}\x1b[0m`;
}

const banner = figlet.textSync("PITCH", {
  font: "Univers",
});

const description = `
Description:
  CLI for interacting with the OpenAI API Fine Tuning API.
`;

program
  .name('pitch')
  .version('0.0.1')
  .description(description)
  .addHelpText('before', banner)
  .configureOutput({
    outputError: (str, write) => write(errorColor(str))
  })


const file = program.command('file');
const tune = program.command("tune");

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

    // upload file
    const response = await openai.files.create({
      file: await toFile(Buffer.from(plainText), "input.jsonl"),
      purpose: 'fine-tune'
    });

    if (response.status !== "uploaded") {
      throw new Error(`Failed to upload ${JSON.stringify(response)}`);
    }

    const job = await openai.fineTuning.jobs.create({
      training_file: response.id,
      model: MODEL
    });

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
  .action(async (filepath, options) => {
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
 * Fine Tuning CLI Commands
 * ==============================================
 */
tune
  .command("status <jobId>")
  .description("get status of job")
  .action(async (jobId) => {
    const job = await openai.fineTunes.retrieve(jobId);

    console.table(job);
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
    // TODO: add pagination
    let items = await openai.fineTuning.jobs.list();

    console.log(items.data);
  });

tune
  .command("retrieve <jobId>")
  .action(async (jobId) => {
    const response = await openai.fineTuning.jobs.retrieve(jobId);

    console.log(response);
  });

program.parse(process.argv);
