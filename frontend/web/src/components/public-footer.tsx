import Link from "next/link";
import { Logo } from "@casax/ui";

const groups = [
  {
    title: "Renters",
    links: [
      { label: "Rentals", href: "/rentals" },
      { label: "Book Inspection", href: "/rentals" },
      { label: "Residents", href: "/residents" },
    ],
  },
  {
    title: "Property Owners",
    links: [
      { label: "Property Owners", href: "/property-owners" },
      { label: "Request Assessment", href: "/property-owners#assessment" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About CasaX", href: "/#why-different" },
      { label: "Contact", href: "mailto:hello@casax.ng" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <Link href="/" aria-label="CasaX home">
            <Logo className="text-slate-950" />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600">
            CasaX helps renters find verified apartments backed by active rental
            operations, inspection coordination, and resident support.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-slate-950">
                {group.title}
              </h3>
              <div className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <Link
                    className="block text-sm text-slate-600 transition-colors hover:text-slate-950"
                    href={link.href}
                    key={link.label}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>&copy; {new Date().getFullYear()} CasaX. All rights reserved.</p>
          <p>
            Verified rentals on CasaX.ng. Resident portal on
            app.CasaX.ng.
          </p>
        </div>
      </div>
    </footer>
  );
}
