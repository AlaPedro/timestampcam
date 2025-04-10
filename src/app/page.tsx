"use client";

import CameraCapture from "./components/CameraCapture";
import { FaCamera, FaGithub } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#101010] font-chakra-petch">
      {/* Header */}
      <header className="bg-zinc-900 text-white p-4 text-center">
        <h1 className="text-2xl font-bold flex items-center gap-2 justify-center">
          BadalaCam <FaCamera />
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <CameraCapture />
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-300 p-4 text-center flex justify-center">
        <button
          onClick={() => window.open("https://github.com/AlaPedro", "_blank")}
          className="text-sm font-bold flex items-center gap-2 cursor-pointers"
        >
          <FaGithub />
          Created by Alapedrodev
        </button>
      </footer>
    </div>
  );
}
