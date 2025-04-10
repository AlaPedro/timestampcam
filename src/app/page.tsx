"use client";

import CameraCapture from "./components/CameraCapture";
import { FaCamera, FaGithub } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-900 to-black font-chakra-petch">
      {/* Header */}
      <header className="bg-zinc-900/50 backdrop-blur-sm text-white p-6 text-center border-b border-zinc-800">
        <h1 className="text-3xl font-bold flex items-center gap-3 justify-center">
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
            BadalaCam
          </span>
          <FaCamera className="text-blue-500" />
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <CameraCapture />
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900/50 backdrop-blur-sm text-zinc-400 p-6 text-center border-t border-zinc-800">
        <button
          onClick={() => window.open("https://github.com/AlaPedro", "_blank")}
          className="text-sm font-bold flex items-center gap-2 hover:text-white transition-colors duration-300 mx-auto"
        >
          <FaGithub className="text-lg" />
          Created by Alapedrodev
        </button>
      </footer>
    </div>
  );
}
