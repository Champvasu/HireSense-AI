'use client';

import Navbar from "@/components/Navbar";

export default function LayoutContent({ children }) {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        {children}
      </main>
    </>
  );
}
