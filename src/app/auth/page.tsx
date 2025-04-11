"use client";

import Auth from "../components/Auth";
import { FaCamera } from "react-icons/fa";
import Link from "next/link";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-900 to-black font-chakra-petch">
      {/* Header */}
      <header className="bg-zinc-900/50 backdrop-blur-sm text-white p-6 text-center border-b border-zinc-800">
        <Link href="/" className="inline-block">
          <h1 className="text-3xl font-bold flex items-center gap-3 justify-center">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
              BadalaCam
            </span>
            <FaCamera className="text-blue-500" />
          </h1>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Auth />
      </main>
    </div>
  );
}
