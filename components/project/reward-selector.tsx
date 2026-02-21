"use client"

interface Reward {
  id: string
  title: string
  description?: string
  amount: number
  shippingType: string
  quantityLimit?: number | null
}

interface RewardSelectorProps {
  rewards: Reward[]
  currency: string
  projectId: string
}

export function RewardSelector({ rewards, currency }: RewardSelectorProps) {
  return (
    <div className="space-y-4">
      {rewards.map((reward) => (
        <div
          key={reward.id}
          className="border-2 border-black p-6 hover:bg-[#fafafa] transition-colors"
        >
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-bold text-lg">{reward.title}</h3>
            <span className="text-xl font-bold tabular-nums">{reward.amount > 0 ? `${currency}${reward.amount.toLocaleString()}` : "Free"}</span>
          </div>
          {reward.description && (
            <p className="text-sm text-[#666] mb-3">{reward.description}</p>
          )}
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 border border-[#ccc]">{reward.shippingType === "DIGITAL" ? "Digital" : reward.shippingType === "WORLDWIDE" ? "Ships worldwide" : "Limited shipping"}</span>
            {reward.quantityLimit && (
              <span className="px-2 py-1 border border-[#ccc]">{reward.quantityLimit} available</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
