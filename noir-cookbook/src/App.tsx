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
        <AttestationProof />
      </main>
    </div>
  );
}

export default App;