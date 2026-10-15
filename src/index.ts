/**
 * Entry point: a phone shop assistant agent.
 *
 * Instead of letting the AI SDK run tools automatically, this file drives the
 * agent loop by hand: call the model, run any tools it asks for, feed the
 * results back, and repeat until the model gives a final answer.
 */

// Loads OPENAI_API_KEY from .env into process.env
import 'dotenv/config'

import { generateText, tool, type ModelMessage } from 'ai'
import { openai } from '@ai-sdk/openai'

import { inventorySchema, checkInventory } from './tools/inventory'
import { calculateTotal, calculatorSchema } from './tools/calculator'

// Tool definitions sent to the model. They have no `execute` function, so the
// SDK only reports tool calls; executeTool() below runs them ourselves.
const tools = {
  checkInventory: tool({
    description: 'Check the price and available quantity of phone',
    inputSchema: inventorySchema,
  }),
  calculateTotal: tool({
    description: 'Calculate a total from a verified unit price and quantity.',
    inputSchema: calculatorSchema,
  }),
}

// Dispatch a tool call by name. Inputs come from the model, so they are
// validated with the same Zod schema before the tool runs.
async function executeTool(name: string, input: unknown): Promise<unknown> {
  switch (name) {
    case 'checkInventory': {
      const args = inventorySchema.parse(input)
      return checkInventory(args)
    }
    case 'calculateTotal': {
      const args = calculatorSchema.parse(input)
      return calculateTotal(args)
    }

    default:
      throw new Error(`Unnkown tool: ${name}`)
  }
}

// Run the agent loop for a single user prompt and return the final answer.
async function runAgent(prompt: string) {
  const messages: ModelMessage[] = [{ role: 'user', content: prompt }]

  // Cap on model calls so a confused model can't loop forever
  const MAX_STEPS = 6
  let step = 0

  while (step < MAX_STEPS) {
    step++

    console.log(`\n ==== STEP ${step} ====`)

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: `
               You are a helpful kenyan phone shop assistant

               Use checkInventory for stock and prices.
               Use calculateTotal when calculating totals.

               Never invent inventory information. 
               Check stock before confirming availability.
               Use verified inventory prices for calculations.
               If stock is insufficient, explain that clearly.
               All prices are in kenyan shillings.
            `,
      messages,
      tools,
      toolChoice: 'auto',
    })

    // Keep the assistant's reply (text and tool calls) in the conversation history
    messages.push(...result.response.messages)

    console.log('Finish reason:', result.finishReason)
    console.log('Model text', result.text)

    // No tool calls means the model is done; return its answer
    if (result.toolCalls.length === 0) {
      if (result.finishReason !== 'stop') {
        throw new Error(`model stopped unexpectedly ${result.finishReason}`)
      }
      console.log(`\n Final ANSWER: `)
      return result.text
    }

    // Collect one result per tool call to send back in a single tool message
    const toolResults: Array<{
      type: 'tool-result'
      toolCallId: string
      toolName: string
      output: { type: 'json'; value: any }
    }> = []

    for (const call of result.toolCalls) {
      console.log('Calling tool', call.toolName)
      console.log('Arguments', call.input)

      let output: unknown

      try {
        output = await executeTool(call.toolName, call.input)
      } catch (error) {
        // Report the failure to the model instead of crashing the loop
        output = {
          error: true,
          message: 'Tool execution failed',
        }
      }

      toolResults.push({
        type: 'tool-result',
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        output: {
          type: 'json',
          value: output,
        },
      })

      console.log('Result', output)
    }

    // Hand the tool results back so the model can use them next step
    messages.push({
      role: 'tool',
      content: toolResults,
    })
  }
  throw new Error(`Agent exceeded ${MAX_STEPS} MODEL CALLS`)
}

runAgent('Do you have 3 iphone 18 phones. and how much will they cost?').catch(console.error)
