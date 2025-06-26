import { ALLOWED_ORIGINS } from "./constants";
import { ProofData, UltraHonkBackend } from "@aztec/bb.js";
import compiledProgram from '../../frontend/circuit/target/zk_coinbase_attestation.json'

interface ProofConfig {
  url?: string;
  timeout?: number;
  popupWidth?: number;
  popupHeight?: number;
}

export function openZkKycPopup(config: ProofConfig = {}): Promise<{
  proof: any,
  publicInputs: string[],
  status: string,
  meta: {
    nonce: string,
    timestamp: string
  }
}> {
  console.log("Opening popup")
  const {
    url = 'http://localhost:3001',
    timeout = 60 * 1000 * 10, // 10 minutes
    popupWidth = 500,
    popupHeight = 600
  } = config;

  console.log("config", config);

  return new Promise((resolve, reject) => {
    console.log("url", url);
    const popup = window.open(
      url + "?origin=" + encodeURIComponent(window.location.origin), 
      "popup", 
      `width=${popupWidth},height=${popupHeight}`
    )

    if (!popup) {
      reject(new Error("Popup was blocked"))
    }

    function handler(event: MessageEvent) {
      if (!ALLOWED_ORIGINS.includes(event.origin)) {
        return;
      }
      
      const { proof, publicInputs, meta, type, status, error } = event.data || {};
      
      console.log("type:", type);
      if (type !== "zk-coinbase-proof") {
        console.log("Wrong event type:", type);
        return;
      }
      
      window.removeEventListener("message", handler);
      resolve({ proof, publicInputs, status: 'success', meta });
    }

    window.addEventListener("message", handler);

    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Popup timed out"))
    }, timeout)
  })
}


export const validateProof = async (proof: ProofData) => {
  const backend = new UltraHonkBackend(compiledProgram.bytecode, { threads: 4 })
  const result = await backend.verifyProof(proof, {keccak: true})
  return result
}