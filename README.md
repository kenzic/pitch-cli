# Pitch CLI

## Introduction

The Pitch CLI is a command-line interface for the Open AI Fine Tuning API that allows you to perform all the file and fine tuning opperations. Files can be uploaded in `JSONL` or [Story format](https://github.com/kenzic/story)

## Installation

```bash
yarn add @kenzic/pitch-cli
```

## Usage

**Upload file and start fine tuning**

```bash
$ pitch start input.jsonl

# or

$ pitch start -f story input.jsonl
```

For more information on the story format, see "[Story format documentation](https://github.com/kenzic/story)"
