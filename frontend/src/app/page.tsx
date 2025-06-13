"use client";

import { v4 as uuidv4 } from "uuid";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleDemo = () => {
    router.push("/verify-attestation");
  };

  return (
    <div className="flex flex-1 flex-col justify-center items-center w-full bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-3xl text-center px-4">
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
  );
}