"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const cities = [
  "Almaty", "Astana", "Moscow", "St. Petersburg", "Kyiv", "Minsk",
  "Bishkek", "Tashkent", "Shymkent", "Kazan", "Novosibirsk", "Odesa",
  "Aktobe", "Karaganda", "Pavlodar", "Brest", "Kharkiv", "Tbilisi",
]

const projectNames = [
  "Modular Synthesizer", "Grid/System Typeface", "Ceramic Objects",
  "Nomad Coffee Co.", "Urban Garden Kit", "Steppe Photography Book",
  "AI Language Tutor", "Handmade Leather Bags", "Board Game: Silk Road",
  "Open-Source Drone", "Kazakh Comics Anthology", "Portable Air Monitor",
  "Smart Kumis Fermenter", "Indie Film: Aral", "Recycled Felt Furniture",
]

const currencies = [
  { symbol: "₸", amounts: [2500, 5000, 10000, 15000, 25000, 50000] },
  { symbol: "₽", amounts: [1000, 2500, 5000, 10000, 15000] },
  { symbol: "₴", amounts: [500, 1000, 2500, 5000] },
]

function generateMockPledge() {
  const city = cities[Math.floor(Math.random() * cities.length)]
  const project = projectNames[Math.floor(Math.random() * projectNames.length)]
  const curr = currencies[Math.floor(Math.random() * currencies.length)]
  const amount = curr.amounts[Math.floor(Math.random() * curr.amounts.length)]
  const secondsAgo = Math.floor(Math.random() * 120) + 3

  return {
    id: Math.random().toString(36).slice(2),
    city,
    project,
    amount: `${curr.symbol}${amount.toLocaleString()}`,
    time: secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo / 60)}m ago`,
  }
}

export function LiveFeed() {
  const [items, setItems] = useState<ReturnType<typeof generateMockPledge>[]>([])
  const [mounted, setMounted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setItems(Array.from({ length: 6 }, generateMockPledge))
    setMounted(true)

    intervalRef.current = setInterval(() => {
      setItems((prev) => {
        const next = [generateMockPledge(), ...prev.slice(0, 5)]
        return next
      })
    }, 4000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <section className="border-b border-black bg-black text-white overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-[#999]">Live activity</span>
        </div>

        <div className="relative h-8 overflow-hidden">
          {mounted && items.length > 0 && (
            <AnimatePresence mode="popLayout">
              {items.slice(0, 1).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex items-center"
                >
                  <p className="text-sm md:text-base truncate">
                    <span className="text-[#999]">Someone from</span>{" "}
                    <span className="font-bold">{item.city}</span>{" "}
                    <span className="text-[#999]">pledged</span>{" "}
                    <span className="font-bold">{item.amount}</span>{" "}
                    <span className="text-[#999]">to</span>{" "}
                    <span className="font-bold">{item.project}</span>{" "}
                    <span className="text-[#666] text-xs ml-2">{item.time}</span>
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  )
}
