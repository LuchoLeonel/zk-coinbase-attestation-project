import { create } from 'zustand';

type ProofStore = {
  proofs: any[];
  setProofs: (proofs: any[]) => void;
  resetProofs: () => void;
};

export const useProofStore = create<ProofStore>((set) => ({
  proofs: [],
  setProofs: (proofs) => set({ proofs }),
  resetProofs: () => set({ proofs: [] }),
}));
