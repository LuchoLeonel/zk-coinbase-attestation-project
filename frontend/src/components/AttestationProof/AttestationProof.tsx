import { useEffect, useState } from 'react';
import { ProofData, UltraHonkBackend } from "@aztec/bb.js";
import {
  Transaction, keccak256, toBeArray, Signature, getBytes, SigningKey, toUtf8Bytes, toBeHex  , zeroPadValue
} from 'ethers'
import { v4 as uuidv4 } from 'uuid'
import { useWalletClient } from 'wagmi'
import { BrowserProvider } from 'ethers'
import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";
import { CompiledCircuit,  Noir  } from '@noir-lang/noir_js'
import { useAccount } from 'wagmi'
import * as circomlib from 'circomlibjs';
import { poseidonHash } from '../../utils/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { bytesToHex, hexToBytes } from '../../utils/bytesToHex';

const VITE_PUBLIC_BASE_API_KEY = import.meta.env.VITE_PUBLIC_BASE_API_KEY;
const CIRCUIT_URL = "https://raw.githubusercontent.com/LuchoLeonel/zk-coinbase-attestation-project/refs/heads/sdk/frontend/circuit/target/zk_coinbase_attestation.json"

export default function AttestationProof() {
  const [status, setStatus] = useState<"idle" | "fetching" | "challenge" | "generating" | "finish">("idle")
  const [error, setError] = useState<string | null>(null)
  const [proof, setProof] = useState<ProofData | null>(null);
  const [noir, setNoir] = useState<Noir | null>(null)
  const [backend, setBackend] = useState<UltraHonkBackend | null>(null)
  const { data: walletClient } = useWalletClient()
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        initACVM(fetch(acvm)),
        initNoirC(fetch(noirc)),
      ]);

      const metaRes = await fetch(CIRCUIT_URL);
      const compiledProgram = await metaRes.json();
      const noirInstance = new Noir(compiledProgram);
      const backendInstance = new UltraHonkBackend(compiledProgram.bytecode, { threads: 4 });

      setNoir(noirInstance);
      setBackend(backendInstance);
    };

    init();
  }, []);

  async function fetchKycAttestation(address: string): Promise<any> {
    const now = Math.floor(Date.now() / 1000);
    const query = `query GetAttestations($recipient: String!, $attester: String!, $schemaId: String!, $now: Int!) {
      attestations(
        where: {
          recipient: { equals: $recipient }
          schemaId: { equals: $schemaId }
          attester: { equals: $attester }
          revocationTime: { equals: 0 }
          OR: [
            { expirationTime: { equals: 0 } }
            { expirationTime: { gt: $now } }
          ]
        }
        orderBy: { time: desc }
        take: 1
      ) {
        txid
      }
    }`;
    const res = await fetch("https://base.easscan.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: {
          recipient: address,
          attester: "0x357458739F90461b99789350868CD7CF330Dd7EE",
          schemaId: "0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9",
          now,
        },
      }),
    });
    const json = await res.json();
    return json.data?.attestations?.[0] || null;
  }  

  const fetchTxAndGenerateProof = async () => {
    setStatus("fetching");
    setProof(null);
    setError(null);
  
    try {

      const txData = await fetchKycAttestation(address!);
      const txHash = txData?.txid;
  
      console.log("Attestation txHash:", txHash);
  
      if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
        setError('Invalid or missing txHash from EAS subgraph');
        setStatus("idle");
        return;
      }
  
      // Get tx details from Basescan API
      const res = await fetch(
        `https://api.basescan.org/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${VITE_PUBLIC_BASE_API_KEY}`
      );
      const json = await res.json();
      const tx = json?.result;
  
      if (!tx || !tx.input || !tx.r || !tx.s || !tx.v || !tx.from) {
        setError('Invalid or missing transaction data from Basescan API');
        setStatus("idle");
        return;
      }
  
      // Parse transaction inputs
      setStatus("challenge");
      const calldataBytes = Array.from(getBytes(tx.input));
  
      const { txSignature, txPubKeyX, txPubKeyY, txHashBytes } = parseTxInputs(tx);
      const { userSignature, userPubKeyX, userPubKeyY, nonceBigInt, timestampBigInt } = await parseUserChallenge();
  
      const inputs = {
        attester_pub_key_x: txPubKeyX.map((v) => BigInt(v).toString()),
        attester_pub_key_y: txPubKeyY.map((v) => BigInt(v).toString()),
        attester_signature: txSignature.map((v) => BigInt(v).toString()),
        hashed_attestation_tx: txHashBytes.map((v) => BigInt(v).toString()),
        user_pub_key_x: userPubKeyX.map((v) => BigInt(v).toString()),
        user_pub_key_y: userPubKeyY.map((v) => BigInt(v).toString()),
        user_signature: userSignature.map((v) => BigInt(v).toString()),
        nonce_hash: nonceBigInt.toString(),
        timestamp_hash: timestampBigInt.toString(),
        tx_calldata: calldataBytes.map((v) => BigInt(v).toString()),
      };
  
      console.log("Inputs to ZK circuit:", inputs);
  
      // Execute the Noir circuit and generate the proof
      setStatus("generating");
      const t0 = performance.now();
  
      if (!noir || !backend) {
        console.warn("ZK circuit not ready yet");
        return;
      }
  
      const { witness } = await noir.execute(inputs);
      const result = await backend.generateProof(witness, { keccak: true });
  
      const t1 = performance.now();
      console.log("ZK Proof generated in", (t1 - t0).toFixed(2), "ms");
  
      setProof(result);
      setStatus("finish");
      
      console.log("Dispatching Success Event");

      const proof_hex = bytesToHex(result.proof);
      const proofBase64 = Buffer.from(result.proof).toString("base64");

      const successData = {
        proof: proofBase64,
        publicInputs: result.publicInputs,
        meta: {
          nonce: nonceBigInt.toString(),
          timestamp: timestampBigInt.toString(),
        },
        type: "zk-coinbase-proof"
      };
      console.log("Sending success data:", successData);
      console.log("Window origin:", window.location.origin);

      window.opener?.postMessage(successData, "*");

      const proof_bytes = hexToBytes(proof_hex);

      validateProof({proof: proof_bytes, publicInputs: result.publicInputs});
      console.log("Success event dispatched");
  
    } catch (err) {
      console.error('Error in fetchTxAndGenerateProof:', err);
      setStatus("idle");
      setError(err instanceof Error ? err.message : JSON.stringify(err));
    
      console.log("=== Dispatching Error Event ===");
      const errorData = {
        status: "error",
        error: err instanceof Error ? err.message : JSON.stringify(err),
        type: "zk-coinbase-proof"
      };
      console.log("Sending error data:", errorData);
      console.log("Window origin:", window.location.origin);

      window.postMessage(errorData, "*");
      
      console.log("Error event dispatched");
    }
  };

  const parseUserChallenge = async () => {
    if (!walletClient) throw new Error('No wallet client');

    const provider = new BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();
    const nonce = uuidv4();
    const timestamp = Date.now().toString();

    const poseidon = await circomlib.buildPoseidon();
    const {hash, value1Hash, value2Hash} = await poseidonHash(nonce, timestamp);

    const nonceBigInt = poseidon.F.toObject(value1Hash).toString();
    const timestampBigInt = poseidon.F.toObject(value2Hash).toString();
    const hashBigInt = poseidon.F.toObject(hash);
    const digest = zeroPadValue(toBeHex(hashBigInt), 32);
    const signerAddress = await signer.getAddress();
    const sig = await walletClient.signMessage({
      account: signerAddress as `0x${string}`,
      message: { raw: digest as `0x${string}` }
    });

    const signature = Signature.from(sig);
    const rBytes = getBytes(signature.r);
    const sBytes = getBytes(signature.s);
    const userSignature = [...rBytes, ...sBytes];

    const prefix = "\x19Ethereum Signed Message:\n32";
    const digestBytes = getBytes(digest);
    const prefixedMessage = keccak256(
      new Uint8Array([
        ...toUtf8Bytes(prefix),
        ...digestBytes
      ])
    );

    const pubKeyHex = SigningKey.recoverPublicKey(prefixedMessage, sig);
    const pubKeyBytes = getBytes(pubKeyHex);
    const userPubKeyX = Array.from(pubKeyBytes.slice(1, 33));
    const userPubKeyY = Array.from(pubKeyBytes.slice(33, 65));

    return { userSignature, userPubKeyX, userPubKeyY, nonceBigInt, timestampBigInt };
  };

  const parseTxInputs = (tx: any) => {
    const unsignedTx = {
      chainId: parseInt(tx.chainId, 16),
      nonce: parseInt(tx.nonce, 16),
      gasLimit: BigInt(tx.gas),
      maxFeePerGas: BigInt(tx.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
      to: tx.to,
      value: BigInt(tx.value),
      data: tx.input,
      type: parseInt(tx.type, 16),
      accessList: []
    };

    const fullTx = Transaction.from(unsignedTx);
    const rawBytes = toBeArray(fullTx.unsignedSerialized);
    const digest = keccak256(rawBytes);
    const sig = Signature.from({ r: tx.r, s: tx.s, v: parseInt(tx.v) % 27 });
    const pubKeyHex = SigningKey.recoverPublicKey(digest, sig);
    const pubKeyBytes = getBytes(pubKeyHex);
    return {
      txSignature: [...getBytes(sig.r), ...getBytes(sig.s)],
      txPubKeyX: Array.from(pubKeyBytes.slice(1, 33)),
      txPubKeyY: Array.from(pubKeyBytes.slice(33, 65)),
      txHashBytes: Array.from(getBytes(digest))
    };
  };

  const validateProof = async (proof: ProofData) => {
    console.log("Validating proof...");
    console.log({proof, backend});
    if (!backend) return;
    const result = await backend.verifyProof(proof, { keccak: true });
    console.log("Proof validation result:", result);
  };

  return (
    <div className="flex flex-1 flex-col justify-center items-center w-full bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 pt-10">ZK Coinbase Attestation Project</h1>
        <p className="text-gray-600 text-base">
          This process fetches the Base transaction used in your Coinbase attestation and generates a zk proof asserting both your verification status and wallet ownership.
        </p>
        <div className="flex justify-center items-center">
          {isConnected ? (
          <button
            onClick={fetchTxAndGenerateProof}
            disabled={(status !== "idle" && status !== "finish") || !address}
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status !== 'idle' && status !== 'finish' && (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {{
              idle: 'Fetch Attestation Transaction',
              fetching: 'Fetching transaction...',
              challenge: 'Verifying account ownership...',
              generating: 'Generating zk proof...',
              finish: 'Done! Fetch another account'
            }[status]}
          </button>
          ) : (
            <ConnectButton />
          )}
        </div>
        {error && (
          <div className="mt-4 text-red-600 text-sm bg-red-100 p-2 rounded-md border border-red-200">
            {error}
          </div>
        )}
        {proof && (
          <div className="bg-gray-100 p-4 rounded overflow-x-auto text-sm text-gray-800 border border-gray-300 break-all">
            {JSON.stringify(proof)}
          </div>
        )}
      </div>
    </div>
  );
}