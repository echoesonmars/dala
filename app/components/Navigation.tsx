"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { SearchBar } from "./SearchBar"

const navLinks = [
  { href: "/browse", label: "Browse" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
]

export function Navigation() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const username = (session?.user as Record<string, unknown>)?.username as string | undefined
  const displayName = session?.user?.name || username || "Account"

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-white"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="border-b-2 border-black">
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-14 flex items-center gap-4">
            <Link
              href="/"
              className="text-xl font-[family-name:var(--font-shippori-mincho)] leading-none hover:opacity-60 transition-opacity shrink-0 flex items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              dala
            </Link>

            <div className="hidden md:flex items-center gap-5 flex-1 min-w-0">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm hover:opacity-60 transition-opacity whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:block w-[260px] shrink-0">
              <SearchBar />
            </div>

            <div className="hidden md:flex items-center gap-3 shrink-0">
              {status === "authenticated" ? (
                <>
                  <Link
                    href={username ? `/u/${username}` : "/dashboard"}
                    className="flex items-center gap-2.5 px-3 py-1.5 border-2 border-[#e5e5e5] hover:border-black transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {displayName[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-mono">@{username || "user"}</span>
                  </Link>
                  <Link href="/dashboard" className="text-sm hover:opacity-60 transition-opacity">
                    Dashboard
                  </Link>
                  <Link href="/settings" className="text-sm hover:opacity-60 transition-opacity">
                    Settings
                  </Link>
                  <button onClick={handleSignOut} className="text-sm text-[#999] hover:text-black transition-colors">
                    Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm hover:opacity-60 transition-opacity">
                    Log in
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="h-8 text-xs">Sign up</Button>
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col gap-1.5 w-8 h-8 items-center justify-center ml-auto shrink-0"
              aria-label="Menu"
            >
              <motion.span
                className="w-5 h-0.5 bg-black block"
                animate={{ rotate: mobileMenuOpen ? 45 : 0, y: mobileMenuOpen ? 8 : 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="w-5 h-0.5 bg-black block"
                animate={{ opacity: mobileMenuOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="w-5 h-0.5 bg-black block"
                animate={{ rotate: mobileMenuOpen ? -45 : 0, y: mobileMenuOpen ? -8 : 0 }}
                transition={{ duration: 0.2 }}
              />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-14 left-0 right-0 bottom-0 bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full flex flex-col">
                <div className="px-4 py-4 border-b border-[#e5e5e5]">
                  <SearchBar />
                </div>

                {status === "authenticated" && (
                  <Link
                    href={username ? `/u/${username}` : "/dashboard"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-6 py-4 border-b border-[#e5e5e5]"
                  >
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-sm font-bold">
                      {displayName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{displayName}</p>
                      <p className="text-xs text-[#999] font-mono">@{username || "user"}</p>
                    </div>
                  </Link>
                )}

                <div className="flex-1 px-6 py-6 space-y-1">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-3 text-lg font-bold hover:opacity-60 transition-opacity"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                  {status === "authenticated" && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.2 }}
                      >
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-3 text-lg font-bold hover:opacity-60 transition-opacity"
                        >
                          Dashboard
                        </Link>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                      >
                        <Link
                          href="/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-3 text-lg font-bold hover:opacity-60 transition-opacity"
                        >
                          Settings
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>

                <div className="border-t-2 border-black p-4 space-y-3">
                  {status === "authenticated" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleSignOut()
                      }}
                    >
                      Log out
                    </Button>
                  ) : (
                    <>
                      <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full">Sign up</Button>
                      </Link>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">Log in</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-14" />
    </>
  )
}
