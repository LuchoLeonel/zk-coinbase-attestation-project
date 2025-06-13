"use client";

import { v4 as uuidv4 } from "uuid";
import { useRouter } from 'next/navigation';

export default function Home() {
  const handleDemo = () => {};
  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-8.5rem)] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center pb-4">
        
          <h2 className="text-3xl text-gray-900 font-bold mb-4">
            ZK Coinbase Attestation Project.
          </h2>
  
          <button
            onClick={handleDemo}
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105"
          >
            Start Demo
          </button>
        </div>
      </div>
    </div>
  );
}