import { ALLOWED_ORIGINS } from "./constants";
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
      url, 
      "_blank", 
      `width=${popupWidth},height=${popupHeight}`
    )

    console.log("popup", popup);
    if (!popup) {
      reject(new Error("Popup was blocked"))
    }

    console.log("popup opened");

    function handler(event: MessageEvent) {
      // For development, allow any localhost origin
      const isAllowedOrigin = ALLOWED_ORIGINS.includes(event.origin)

      if (!isAllowedOrigin) {
        console.log("Origin not allowed:", event.origin);
        return;
      }
      
      console.log("Origin allowed, processing data...");
      const { proof, publicInputs, meta, type, status, error } = event.data || {};
      
      console.log("Extracted data:", { proof, publicInputs, meta, type, status, error });
      
      // Handle error case
      if (status === "error" || error) {
        console.log("Error received:", error);
        window.removeEventListener("message", handler);
        reject(new Error(error || "Unknown error"));
        return;
      }
      
      // Check for required fields
      if (!proof || !publicInputs || !meta || !type) {
        console.log("Missing required fields:", { 
          hasProof: !!proof, 
          hasPublicInputs: !!publicInputs, 
          hasMeta: !!meta, 
          hasType: !!type 
        });
        return;
      }
      
      console.log("type:", type);
      if (type !== "zk-coinbase-proof") {
        console.log("Wrong event type:", type);
        return;
      }
      
      console.log("zk-coinbase-proof event received successfully!");

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