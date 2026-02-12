import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t-2 border-black py-16 px-4 md:px-6 bg-[#fafafa]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="text-3xl font-[family-name:var(--font-shippori-mincho)] leading-none mb-4">dala</div>
            <p className="text-[#666] leading-relaxed mb-6">
              We built this platform because we think creators deserve better. 
              No percentage fees, no algorithm games, just transparent funding.
            </p>
            <p className="text-sm text-[#666]">
              Questions? Email us:<br />
              <a href="mailto:hello@dala.fund" className="text-black hover:opacity-60 transition-opacity font-mono">
                hello@dala.fund
              </a>
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">For Creators</h3>
            <ul className="space-y-2 text-[#666]">
              <li><Link href="/signup" className="hover:text-black transition-colors">Start a project</Link></li>
              <li><Link href="/how-it-works" className="hover:text-black transition-colors">How it works</Link></li>
              <li><Link href="/pricing" className="hover:text-black transition-colors">Pricing & fees</Link></li>
              <li><Link href="/guidelines" className="hover:text-black transition-colors">Project guidelines</Link></li>
              <li><Link href="/success-stories" className="hover:text-black transition-colors">Success stories</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">For Backers</h3>
            <ul className="space-y-2 text-[#666] mb-6">
              <li><Link href="/browse" className="hover:text-black transition-colors">Browse all projects</Link></li>
              <li><Link href="/how-backing-works" className="hover:text-black transition-colors">How backing works</Link></li>
              <li><Link href="/trust-safety" className="hover:text-black transition-colors">Trust & safety</Link></li>
            </ul>
            <div className="flex gap-4 text-sm">
              <a href="#" className="text-[#666] hover:text-black transition-colors">Twitter</a>
              <a href="#" className="text-[#666] hover:text-black transition-colors">Instagram</a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-black text-sm text-[#666]">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <p>© 2026 Dala. Made for people who actually ship.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
              <Link href="/about" className="hover:text-black transition-colors">About us</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
