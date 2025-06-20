interface ProofConfig {
  url?: string;
  timeout?: number;
  popupWidth?: number;
  popupHeight?: number;
}

export function generateProof(config: ProofConfig = {}): Promise<{
  proof: any,
  publicInputs: string[],
  status: string,
  meta: {
    nonce: string,
    timestamp: string
  }
}> {
  const {
    url = 'http://localhost:3001',
    timeout = 60 * 1000 * 10, // 10 minutes
    popupWidth = 500,
    popupHeight = 600
  } = config;

  return new Promise((resolve, reject) => {
    const popup = window.open(
      url, 
      "_blank", 
      `width=${popupWidth},height=${popupHeight}`
    )

    if (!popup) {
      reject(new Error("Popup was blocked"))
    }
    
    function handler(event: MessageEvent) {
      // if (event.origin !== ALLOWED_ORIGIN) return;
      const { proof, publicInputs, status, meta } = event.data || {};
      if (!proof || !publicInputs || !status || !meta) return;

      window.removeEventListener("message", handler);
      resolve({ proof, publicInputs, status, meta });
    }

    window.addEventListener("message", handler);

    setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Popup timed out"))
    }, timeout)
  })
}