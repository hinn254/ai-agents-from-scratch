import {z} from "zod"


export const inventorySchema = z.object({
    productName: z.string().min(1).describe("The phone model to look up")
})

export async function checkInventory(input:z.infer<typeof inventorySchema>) {
  const product = inventory.find((item) => item.name.toLowerCase() === input.productName.trim().toLowerCase())

  if (!product) {
    return {
        found: false,
        message: "Product not found."
    }
  }
  return {
    found: true,
    product: product.name,
    price: product.price,
    quantity: product.quantity,
    inStock: product.quantity > 0
  }
}


const inventory = [
    {
        name: "iphone 18",
        price: 95000,
        quantity: 5
    },
    {
        name: "Samsung s24",
        price: 110000,
        quantity: 3
    },
    {
        name: "iphone 13",
        price: 65000,
        quantity: 0,
    },
]