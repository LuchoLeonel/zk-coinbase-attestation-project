// src/App.tsx
import { ConnectButton } from '@rainbow-me/rainbowkit';
import AttestationProof from "../src/components/AttestationProof/AttestationProof"; 


function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gray-900 text-white p-4 flex justify-end">
        <ConnectButton />
      </header>
      <main className="flex flex-col items-center justify-center flex-1 text-center px-4">
        <h1 className="text-3xl font-bold mb-4">ZK Coinbase Attestation Project</h1>
        <p className="text-gray-600 mb-6 max-w-xl">
          This process fetches the Base transaction used in your Coinbase attestation
          and generates a zk proof asserting both your verification status and wallet ownership.
        </p>
        <AttestationProof />
      </main>
    </div>
  );
}

export default App;