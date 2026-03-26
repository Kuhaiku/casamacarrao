"use client"

import { useStore } from "@/lib/store"
import { useOrder } from "@/lib/order-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react"
import type { CategoryType, MenuItem } from "@/lib/types"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const steps = [
  { id: 1, label: "Massa", category: "pasta" as CategoryType },
  { id: 2, label: "Molho", category: "sauce" as CategoryType },
  { id: 3, label: "Ingredientes", category: "ingredient" as CategoryType },
  { id: 4, label: "Temperos", category: "seasoning" as CategoryType },
  { id: 5, label: "Extras", category: null },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              currentStep === step.id
                ? "bg-primary text-primary-foreground"
                : currentStep > step.id
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                "w-8 h-0.5 mx-1",
                currentStep > step.id ? "bg-primary/40" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function ItemSelector({
  items,
  selected,
  onToggle,
  max,
  extraPrice,
  isSeasoning = false,
}: {
  items: MenuItem[]
  selected: string[]
  onToggle: (id: string) => void
  max: number
  extraPrice: number
  isSeasoning?: boolean
}) {
  const isOverLimit = !isSeasoning && selected.length > max
  const extraCount = Math.max(0, selected.length - max)

  return (
    <div className="space-y-4">
      {!isSeasoning && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Selecionados: <span className="font-medium text-foreground">{selected.length}</span> / {max}
          </span>
          {isOverLimit && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <AlertCircle className="h-3 w-3 mr-1" />
              +{extraCount} extra ({formatCurrency(extraCount * extraPrice)})
            </Badge>
          )}
        </div>
      )}
      {isSeasoning && (
        <p className="text-sm text-muted-foreground">Escolha quantos temperos quiser!</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => {
          const isSelected = selected.includes(item.id)
          const wouldExceed = !isSeasoning && !isSelected && selected.length >= max
          
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
                wouldExceed && "border-dashed"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("font-medium", isSelected && "text-primary")}>
                  {item.name}
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              {wouldExceed && !isSelected && (
                <span className="text-xs text-muted-foreground">
                  +{formatCurrency(extraPrice)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ExtrasStep() {
  const { settings } = useStore()
  const { currentItem, updateCurrentItem } = useOrder()

  if (!currentItem) return null

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border-2 border-dashed">
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={currentItem.extraCheese}
            onCheckedChange={(checked) => updateCurrentItem({ extraCheese: !!checked })}
          />
          <div className="flex-1">
            <div className="font-medium">Queijo Extra</div>
            <div className="text-sm text-muted-foreground">
              Uma camada extra de queijo derretido
            </div>
          </div>
          <Badge variant="secondary">
            +{formatCurrency(settings.extraCheesePrice)}
          </Badge>
        </label>
      </div>
    </div>
  )
}

export function OrderBuilder() {
  const { menuItems, sizes, settings } = useStore()
  const { currentItem, updateCurrentItem, step, setStep, addItemToCart } = useOrder()

  if (!currentItem) return null

  const size = sizes.find((s) => s.id === currentItem.sizeId)
  if (!size) return null

  const currentStepConfig = steps[step - 1]
  const activeItems = menuItems.filter(
    (item) => item.isActive && item.category === currentStepConfig?.category
  )

  const getSelected = (): string[] => {
    switch (currentStepConfig?.category) {
      case "pasta": return currentItem.pastas
      case "sauce": return currentItem.sauces
      case "ingredient": return currentItem.ingredients
      case "seasoning": return currentItem.seasonings
      default: return []
    }
  }

  const getMax = (): number => {
    switch (currentStepConfig?.category) {
      case "pasta": return size.maxPastas
      case "sauce": return size.maxSauces
      case "ingredient": return size.maxIngredients
      default: return Infinity
    }
  }

  const handleToggle = (id: string) => {
    const selected = getSelected()
    const field = currentStepConfig?.category === "pasta" ? "pastas"
      : currentStepConfig?.category === "sauce" ? "sauces"
      : currentStepConfig?.category === "ingredient" ? "ingredients"
      : "seasonings"
    
    if (selected.includes(id)) {
      updateCurrentItem({ [field]: selected.filter((s) => s !== id) })
    } else {
      updateCurrentItem({ [field]: [...selected, id] })
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return currentItem.pastas.length > 0
      case 2: return currentItem.sauces.length > 0
      default: return true
    }
  }

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1)
    } else {
      addItemToCart()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      setStep(0)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Montando: {size.name}</CardTitle>
            <CardDescription>
              {currentStepConfig?.label || ""}
            </CardDescription>
          </div>
          <Badge variant="outline">{formatCurrency(size.price)}</Badge>
        </div>
        <StepIndicator currentStep={step} />
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 5 ? (
          <ExtrasStep />
        ) : (
          <ItemSelector
            items={activeItems}
            selected={getSelected()}
            onToggle={handleToggle}
            max={getMax()}
            extraPrice={settings.extraIngredientPrice}
            isSeasoning={currentStepConfig?.category === "seasoning"}
          />
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            {step === 5 ? "Adicionar ao Carrinho" : "Próximo"}
            {step < 5 && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
