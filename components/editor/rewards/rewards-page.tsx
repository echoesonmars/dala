"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Item {
  id: string
  title: string
  description?: string
}

interface RewardTier {
  id: string
  title: string
  description?: string
  amount: number
  shippingType: string
  quantityLimit?: number | null
  itemIds: string[]
}

interface RewardsPageProps {
  projectId: string
  currency: string
  onRewardCountChange?: (count: number) => void
}

const currencySymbols: Record<string, string> = {
  KZT: "₸",
  RUB: "₽",
  UAH: "₴",
  BYN: "Br",
}

export function RewardsPage({ projectId, currency, onRewardCountChange }: RewardsPageProps) {
  const symbol = currencySymbols[currency] || currency
  const [items, setItems] = useState<Item[]>([])
  const [tiers, setTiers] = useState<RewardTier[]>([])
  const [loading, setLoading] = useState(true)

  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [tierDialogOpen, setTierDialogOpen] = useState(false)

  const [newItem, setNewItem] = useState({ title: "", description: "" })
  const [newTier, setNewTier] = useState({
    title: "",
    description: "",
    amount: 0,
    shippingType: "DIGITAL",
    quantityLimit: null as number | null,
    itemIds: [] as string[],
  })

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, tiersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/items`),
        fetch(`/api/projects/${projectId}/rewards`),
      ])
      if (itemsRes.ok) setItems(await itemsRes.json().then((d) => d.items || []))
      if (tiersRes.ok) {
        const rewardsData = await tiersRes.json().then((d) => d.rewards || [])
        setTiers(rewardsData)
        onRewardCountChange?.(rewardsData.length)
      }
    } catch {
      /* */
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchData() }, [fetchData])

  const createItem = async () => {
    const res = await fetch(`/api/projects/${projectId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    })
    if (res.ok) {
      setNewItem({ title: "", description: "" })
      setItemDialogOpen(false)
      fetchData()
    }
  }

  const deleteItem = async (id: string) => {
    await fetch(`/api/projects/${projectId}/items/${id}`, { method: "DELETE" })
    fetchData()
  }

  const createTier = async () => {
    const res = await fetch(`/api/projects/${projectId}/rewards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTier),
    })
    if (res.ok) {
      setNewTier({ title: "", description: "", amount: 0, shippingType: "DIGITAL", quantityLimit: null, itemIds: [] })
      setTierDialogOpen(false)
      fetchData()
    }
  }

  const deleteTier = async (id: string) => {
    await fetch(`/api/projects/${projectId}/rewards/${id}`, { method: "DELETE" })
    fetchData()
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Rewards</h2>
        <p className="text-sm text-[#666]">
          Define what backers get in return for their support. This is how it works:
        </p>
      </div>

      <div className="border-2 border-[#e5e5e5] p-5 space-y-3 bg-[#fafafa]">
        <p className="text-sm font-bold">How rewards work</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#666]">
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 border-2 border-black flex items-center justify-center font-bold text-sm">1</span>
            <div>
              <p className="font-bold text-black">Create Items</p>
              <p>Items are the individual things you deliver: a digital file, a t-shirt, a sticker, etc.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 w-6 h-6 border-2 border-black flex items-center justify-center font-bold text-sm">2</span>
            <div>
              <p className="font-bold text-black">Bundle into Reward Tiers</p>
              <p>Combine items into tiers at different pledge amounts. Example: &ldquo;Early Bird&rdquo; = 1 Book + 1 Sticker at {symbol}5000.</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList className="w-full justify-start border-b-2 border-black bg-transparent p-0 h-auto">
          <TabsTrigger value="items" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-4 py-2">
            Items ({items.length})
          </TabsTrigger>
          <TabsTrigger value="tiers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-4 py-2">
            Reward Tiers ({tiers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="pt-8 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#666]">
              Individual things you&apos;ll deliver to backers.
            </p>
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
              <DialogTrigger asChild>
                <Button>+ New item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      placeholder="e.g. Digital Download"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="What is this item?"
                    />
                  </div>
                  <Button onClick={createItem} disabled={!newItem.title} className="w-full">
                    Create item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {items.length === 0 ? (
            <div className="border-2 border-dashed border-[#ccc] p-12 text-center">
              <p className="text-[#999] mb-4">No items yet</p>
              <Button variant="outline" onClick={() => setItemDialogOpen(true)}>
                Create your first item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="border-2 border-black p-4 flex items-start justify-between">
                  <div>
                    <p className="font-bold">{item.title}</p>
                    {item.description && <p className="text-xs text-[#666] mt-1">{item.description}</p>}
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="text-xs hover:opacity-60 transition-opacity">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tiers" className="pt-8 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#666]">
              Each tier is a package backers can pledge for. Combine items + set a price.
            </p>
            <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
              <DialogTrigger asChild>
                <Button>+ New tier</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create reward tier</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newTier.title}
                      onChange={(e) => setNewTier({ ...newTier, title: e.target.value })}
                      placeholder="e.g. Early Bird Bundle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newTier.description}
                      onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
                      placeholder="What does this tier include?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pledge amount ({symbol})</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] font-bold">{symbol}</span>
                      <Input
                        type="number"
                        value={newTier.amount || ""}
                        onChange={(e) => setNewTier({ ...newTier, amount: Number(e.target.value) })}
                        className="pl-8"
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Shipping</Label>
                    <RadioGroup
                      value={newTier.shippingType}
                      onValueChange={(v) => setNewTier({ ...newTier, shippingType: v })}
                    >
                      <label className="flex items-center gap-3 p-3 border border-[#ccc] cursor-pointer">
                        <RadioGroupItem value="DIGITAL" />
                        <span className="text-sm">No shipping (digital)</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-[#ccc] cursor-pointer">
                        <RadioGroupItem value="WORLDWIDE" />
                        <span className="text-sm">Ships anywhere</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-[#ccc] cursor-pointer">
                        <RadioGroupItem value="RESTRICTED" />
                        <span className="text-sm">Ships to specific countries</span>
                      </label>
                    </RadioGroup>
                  </div>

                  {items.length > 0 && (
                    <div className="space-y-2">
                      <Label>Include items</Label>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <label key={item.id} className="flex items-center gap-3 p-3 border border-[#ccc] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newTier.itemIds.includes(item.id)}
                              onChange={(e) => {
                                const ids = e.target.checked
                                  ? [...newTier.itemIds, item.id]
                                  : newTier.itemIds.filter((i) => i !== item.id)
                                setNewTier({ ...newTier, itemIds: ids })
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{item.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Quantity limit (optional)</Label>
                    <Input
                      type="number"
                      value={newTier.quantityLimit ?? ""}
                      onChange={(e) => setNewTier({ ...newTier, quantityLimit: e.target.value ? Number(e.target.value) : null })}
                      placeholder="Leave empty for unlimited"
                      min={1}
                    />
                  </div>

                  <Button onClick={createTier} disabled={!newTier.title || newTier.amount < 0} className="w-full">
                    Create tier
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {tiers.length === 0 ? (
            <div className="border-2 border-dashed border-[#ccc] p-12 text-center">
              <p className="text-[#999] mb-2">No reward tiers yet</p>
              <p className="text-xs text-[#999] mb-4">
                {items.length === 0
                  ? "Go to the Items tab first and add what you'll deliver. Then come back here to set prices."
                  : `You have ${items.length} item${items.length !== 1 ? "s" : ""} ready. Bundle them into tiers that backers can pledge for.`}
              </p>
              <Button variant="outline" onClick={() => items.length === 0 ? undefined : setTierDialogOpen(true)} disabled={items.length === 0}>
                {items.length === 0 ? "Create items first" : "Create your first tier"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tiers.map((tier) => (
                <div key={tier.id} className="border-2 border-black p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <p className="font-bold">{tier.title}</p>
                        <span className="text-sm text-[#666]">
                          {tier.amount > 0 ? `${symbol}${tier.amount}` : "Free"}
                        </span>
                      </div>
                      {tier.description && <p className="text-xs text-[#666] mt-1">{tier.description}</p>}
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 border border-[#ccc]">{tier.shippingType}</span>
                        {tier.quantityLimit && (
                          <span className="text-xs px-2 py-0.5 border border-[#ccc]">
                            {tier.quantityLimit} available
                          </span>
                        )}
                        {tier.itemIds.length > 0 && (
                          <span className="text-xs px-2 py-0.5 border border-[#ccc]">
                            {tier.itemIds.length} item{tier.itemIds.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteTier(tier.id)} className="text-xs hover:opacity-60 transition-opacity">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
