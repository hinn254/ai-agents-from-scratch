import { z } from 'zod'

// Input the model must provide to look up a phone
export const inventorySchema = z.object({
  productName: z.string().min(1).describe('The phone model to look up'),
})

// Look up a phone by name (case-insensitive, surrounding spaces ignored) and
// report its price and stock. Returns found: false for unknown models.
export async function checkInventory(input: z.infer<typeof inventorySchema>) {
  const product = inventory.find(
    (item) => item.name.toLowerCase() === input.productName.trim().toLowerCase(),
  )

  if (!product) {
    return {
      found: false,
      message: 'Product not found.',
    }
  }
  return {
    found: true,
    product: product.name,
    price: product.price,
    quantity: product.quantity,
    inStock: product.quantity > 0,
  }
}

// In-memory stand-in for a real database. Prices are in Kenyan shillings (KES).
const inventory = [
  {
    name: 'iphone 18',
    price: 95000,
    quantity: 5,
  },
  {
    name: 'Samsung s24',
    price: 110000,
    quantity: 3,
  },
  {
    name: 'iphone 13',
    price: 65000,
    quantity: 0,
  },
]
