import { z } from 'zod'

// Input the model must provide when it asks for a total
export const calculatorSchema = z.object({
  price: z.number().positive().describe('The price of the product'),
  quantity: z.number().int().positive().describe('The quantity of the product'),
})

// Multiply unit price by quantity. Doing the maths in code avoids relying on
// the model for arithmetic.
export async function calculateTotal(input: z.infer<typeof calculatorSchema>) {
  return {
    total: input.price * input.quantity,
    currency: 'KES',
  }
}
