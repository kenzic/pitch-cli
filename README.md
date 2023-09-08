# Pitch CLI

## Introduction

The Pitch CLI is a command-line interface for the Open AI Fine Tuning API. It allows you to easily interact with the API to turn a `story` file into a fine-tuned model in one step. The CLI also exposes commands that allow you to perform all the file and fine tuning opperations from the command line.

## Installation

```bash
yarn add @kenzic/pitch-cli
```

## Usage

### CLI

#### Story to Fine-Tuned Model

```bash
pitch start input.story
```
For more information on the story format, see "Story Format Documentation" below.

# Story Format Documentation

## Introduction

The `story` format is a plain text system designed to facilitate the creation of fine-tuning training examples for OpenAI's GPT-3.5 models. Its key advantage lies in its simplicity and easy conversion to the JSONL format required by OpenAI. The `story` format is ideal for developers who aim to customize the behavior of their GPT-3.5 model without dealing with complex data structures.

## Basic Structure

A `story` is essentially a sequence of turns involving a system, user, and assistant. Each turn is designated by the role initiating it (System, User, or Assistant), followed by a colon, and then the corresponding text.

```
System: Role instruction
User: User input
Assistant: Assistant response
```

Multiple turns can exist in a single `story`, and they are separated by empty lines. Each story represents a single conversational scenario.

## Example

Here is an example in the `story` format:

```
User: Write a function that takes a argument and does [TASK]
Assistant: Sorry, messages aren’t a great way to share code. but checkout my github

---

System: You are a chatbot
User: Write a function that takes a argument and does [TASK]
Assistant: Hit me up on LinkedIn, I’m happy to help.
User: I need it now
Assistant: I hear you. have you tried Chat GPT? It can be pretty helpful
```

## Converting to JSONL

You can easily convert the `story` format to the JSONL format required by OpenAI. Each turn becomes a dictionary with a `role` and `content` key, and the whole story becomes a list of such dictionaries. This list is then serialized as a JSON line in a `.jsonl` file.

## Advantages

- Simplicity: Easy to read and write, reducing the chances of making errors.
- Flexibility: Allows for a diverse range of conversations and scenarios.
- Easy Conversion: Facilitates a straightforward transformation to the required JSONL format.

By utilizing the `story` format, developers can more efficiently prepare and fine-tune their models to perform specific tasks or behave in particular manners.
