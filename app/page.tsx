"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Navigation, 
  Hero, 
  LiveFeed,
  Stats, 
  WhyDifferent,
  FeaturedProjectsSection, 
  Impact,
  FinalCTA,
  Footer 
} from "./components"

export default function Home() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/feed")
    }
  }, [status, router])

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="overflow-hidden">
        <Hero />
        <LiveFeed />
        <Stats />
        <WhyDifferent />
        
        <section className="py-20 md:py-32 border-b border-black">
          <div className="px-4 md:px-6 max-w-[1200px] mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Projects people are funding right now
              </h2>
              <p className="text-lg text-[#666]">
                Real creators, real products, real deadlines.
              </p>
            </motion.div>
            <FeaturedProjectsSection />
          </div>
        </section>

        <Impact />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}
