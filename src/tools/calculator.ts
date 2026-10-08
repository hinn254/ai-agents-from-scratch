import {z} from "zod"

export const calculatorSchema = z.object({
    price: z.number().positive().describe("The price of the product"),
    quantity:z.number().int().positive().describe("The quantity of the product"),
})

export async function calculateTotal(
    input: z.infer<typeof calculatorSchema>
){
 return {
    total: input.price * input.quantity,
    currency:"KES"
 }
}