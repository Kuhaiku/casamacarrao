// Types for Casa do Macarrão ordering system

export type CategoryType = 'pasta' | 'sauce' | 'seasoning' | 'ingredient'

export interface Size {
  id: string
  name: string
  price: number
  maxPastas: number
  maxIngredients: number
  maxSauces: number
}

export interface MenuItem {
  id: string
  name: string
  category: CategoryType
  isActive: boolean
}

export interface StoreSettings {
  extraIngredientPrice: number
  extraCheesePrice: number
}

export interface OrderItem {
  sizeId: string
  pastas: string[]
  sauces: string[]
  seasonings: string[]
  ingredients: string[]
  extraCheese: boolean
}

export type OrderStatus = 'novo' | 'aprovado' | 'pronto'
export type PaymentMethod = 'cartao' | 'dinheiro' | 'pix'

export interface Order {
  id: string
  customerName: string
  address: string
  paymentMethod: PaymentMethod
  items: OrderItem[]
  status: OrderStatus
  isPaid: boolean
  total: number
  createdAt: string
}

export interface StoreState {
  sizes: Size[]
  menuItems: MenuItem[]
  settings: StoreSettings
  orders: Order[]
}
