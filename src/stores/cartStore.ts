import { create } from "zustand"
import { persist } from "zustand/middleware"

interface CartItem {
  productId: string
  title: string
  price: number
  image: string
  quantity: number
  sellerId: string
  sellerName: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const currentItems = get().items
        const existingItem = currentItems.find(i => i.productId === item.productId)
        
        if (existingItem) {
          set({
            items: currentItems.map(i =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          })
        } else {
          set({ items: [...currentItems, item] })
        }
      },
      
      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.productId !== productId) })
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map(i =>
            i.productId === productId ? { ...i, quantity } : i
          )
        })
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      }
    }),
    {
      name: "cart-storage"
    }
  )
)
