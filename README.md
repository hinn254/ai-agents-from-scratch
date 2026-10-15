# First AI Agent: Phone Shop Assistant

A small TypeScript AI agent that acts as a Kenyan phone shop assistant. It answers customer questions about stock and prices by calling **tools** instead of making things up.

The project is for learning. It uses the [Vercel AI SDK](https://ai-sdk.dev) with OpenAI, but writes the **agent loop by hand**, so you can see each step an agent takes:

1. Send the conversation to the model.
2. If the model asks for tools, run them in your own code.
3. Add the tool results to the conversation.
4. Repeat until the model gives a final answer, or a step limit is reached.

## How it works

```
user prompt
    │
    ▼
┌───────────────┐  tool calls   ┌──────────────────┐
│ generateText  │ ────────────▶ │ executeTool()    │
│ (gpt-4o-mini) │ ◀──────────── │  checkInventory  │
└───────────────┘  tool results │  calculateTotal  │
    │                           └──────────────────┘
    │ no tool calls + finishReason "stop"
    ▼
final answer
```

- **Tools are defined without `execute`.** The SDK reports which tools the model wants to call but does not run them. `executeTool()` in `src/index.ts` runs them.
- **Model input is validated.** Each tool's arguments are parsed with the same Zod schema the model was given, before the tool runs.
- **Tool failures don't crash the agent.** If a tool throws, the model receives `{ error: true, message: "Tool execution failed" }` and can respond to it.
- **The loop is capped.** `MAX_STEPS = 6` stops a model that keeps calling tools without finishing.

### Tools

| Tool             | Input                                       | Returns                                            |
| ---------------- | ------------------------------------------- | -------------------------------------------------- |
| `checkInventory` | `productName` (string)                      | `found`, `product`, `price`, `quantity`, `inStock` |
| `calculateTotal` | `price` (positive number), `quantity` (int) | `total`, `currency: "KES"`                         |

Product lookup ignores case and surrounding spaces. The inventory is a hard-coded list in `src/tools/inventory.ts`:

| Phone       | Price (KES) | Stock |
| ----------- | ----------- | ----- |
| iphone 18   | 95,000      | 5     |
| Samsung s24 | 110,000     | 3     |
| iphone 13   | 65,000      | 0     |

## Project structure

```
.
├── src/
│   ├── index.ts            # Agent loop, tool registry, and example prompt
│   └── tools/
│       ├── inventory.ts    # checkInventory tool + in-memory stock data
│       └── calculator.ts   # calculateTotal tool
├── .env.example            # Template for your OpenAI API key
├── .prettierrc.json        # Formatter settings
├── package.json
└── tsconfig.json
```

## Getting started

### Prerequisites

- Node.js 20 or later
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and set your key:

```
OPENAI_API_KEY="sk-..."
```

The `@ai-sdk/openai` provider reads `OPENAI_API_KEY` from the environment. `.env` is git-ignored, so the key stays local.

### Run

```bash
npm run dev
```

This runs the example prompt at the bottom of `src/index.ts`:

> Do you have 3 iphone 18 phones. and how much will they cost?

The console shows each step: the finish reason, any text from the model, each tool call with its arguments and result, and then the final answer. To ask something else, change the string passed to `runAgent(...)`.

## Scripts

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Run the agent with `tsx` (no build step)     |
| `npm run typecheck`    | Type-check the project with `tsc --noEmit`   |
| `npm run format`       | Format all files with Prettier               |
| `npm run format:check` | Check formatting without changing files (CI) |

## Extending the agent

To add a tool:

1. Create `src/tools/<name>.ts` that exports a Zod schema and a function taking `z.infer<typeof schema>`.
2. Register it in the `tools` object in `src/index.ts` with a clear `description`. The model uses the description to decide when to call it.
3. Add a `case` for it in `executeTool()` that parses the input with the schema and calls the function.
4. If needed, update the system prompt to tell the model when to use it.

## Tech stack

- [TypeScript](https://www.typescriptlang.org/), run with [tsx](https://tsx.is/)
- [Vercel AI SDK](https://ai-sdk.dev) (`ai`, `@ai-sdk/openai`)
- [Zod](https://zod.dev) for tool input schemas
- [dotenv](https://github.com/motdotla/dotenv) for loading environment variables
- [Prettier](https://prettier.io) for formatting

## License

ISC
