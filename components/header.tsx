"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [{ label: "Products", href: "/products" }];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/products" className="flex shrink-0 items-center gap-3">
          <div>
            <p className="text-sm font-bold tracking-tight text-gray-900">
              Storage Management
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`border-b-2 px-3 py-5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-700 text-blue-700"
                    : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
