#!/usr/bin/env node
require('dotenv').config();

import fs from 'fs';
import { Command } from '@commander-js/extra-typings';
import OpenAI, { toFile } from 'openai';
import {storyToJsonl} from '@kenzic/story';
import figlet from 'figlet';

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"]
});

const program = new Command();


async function startFineTuning(fileId: string, model = "gpt-3.5-turbo") {
  const response = await openai.fineTuning.jobs.create({
    training_file: fileId,
    model
  });
  return response;
}

function errorColor(str: string) {
  // Add ANSI escape codes to display text in red.
  return `\x1b[31m${str}\x1b[0m`;
}

program
  .name('pitch')
  .version('0.0.1')
  .configureOutput({
    // Visibly override write routines as example!
    writeOut: (str) => process.stdout.write(`[OUT] ${str}`),
    writeErr: (str) => process.stdout.write(`[ERR] ${str}`),
    // Highlight errors in color.
    outputError: (str, write) => write(errorColor(str))
  });

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
  .description("start fine-tuning process")
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
    // use file id to start fine tuning
    const job = await startFineTuning(response.id)

    console.table(job)
  }).addHelpText('after', `
  Examples:
    $ pitch start input.story`
  );

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
      file: fs.createReadStream(filepath), purpose: 'fine-tune' });
    console.table(response);
  });

file
  .command("delete <fileId>")
  .action(async (fileId) => {
    const response = await openai.files.del(fileId);
    console.table(response)
  })

file
  .command("list")
  .action(async () => {
    const response = await openai.files.list();
    console.table(response.data);
  });

file
  .command("retrieve <fileId>")
  .option('-c, --contents', 'retrieve contents', false)
  .action(async (fileId: string, options) => {
    if (options.contents) {
      const response = await openai.files.retrieveContent(fileId);
      console.log(response)
    } else {
      const response = await openai.files.retrieve(fileId);
      console.table(response)
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
  .action(async (jobId, options) => {
    const job = await openai.fineTunes.retrieve(jobId);
    console.table(job);
  });

tune
  .command("create <fileId>")
  .description("create fine-tune job")
  .action(async (fileId, options) => {
    const result = await startFineTuning(fileId);
    console.table(result);
  });

tune
  .command("list")
  .description("list jobs")
  .action(async () => {
    const output: unknown[] = [];
    let items = await openai.fineTuning.jobs.list();
    console.log(items.data);
  });

tune
  .command("retrieve <jobId>")
  .action(async (jobId) => {
    const response = await openai.fineTuning.jobs.retrieve(jobId)
    console.log('response ', response)
  });


// if (!process.argv.slice(2).length) {
//   program.outputHelp();
// }
program.parse(process.argv);
