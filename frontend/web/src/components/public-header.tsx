import Link from "next/link";
import { Button, Logo } from "@casax/ui";
import { MobileMenu } from "@/components/mobile-menu";

const links = [
  { label: "Product", href: "/#product" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Rentals", href: "/rentals" },
  { label: "For Landlords", href: "/#landlords" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/82 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" aria-label="CasaX home">
          <Logo className="text-slate-950" />
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
          {links.map((link) => (
            <Link
              className="transition-colors hover:text-slate-950"
              href={link.href}
              key={link.label}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" asChild>
            <Link href="/auth">Login</Link>
          </Button>
          <Button
            className="rounded-full bg-slate-950 px-4 py-2.5 text-white shadow-sm hover:bg-slate-800 sm:px-5"
            asChild
          >
            <Link href="https://app.casax.ng/auth/register">Get started</Link>
          </Button>
        </div>
        <MobileMenu />
      </nav>
    </header>
  );
}
