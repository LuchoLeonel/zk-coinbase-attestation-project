import { useEffect, useState } from 'react';
import { ProofData, UltraHonkBackend } from "@aztec/bb.js";
import {
  Transaction, keccak256, toBeArray, Signature, getBytes, SigningKey, toUtf8Bytes
} from 'ethers'
import { v4 as uuidv4 } from 'uuid'
import { useWalletClient } from 'wagmi'
import { BrowserProvider } from 'ethers'
import { getAttestations } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';
import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";
import { CompiledCircuit,  Noir  } from '@noir-lang/noir_js'

const VITE_PUBLIC_BASE_API_KEY = import.meta.env.VITE_PUBLIC_BASE_API_KEY;

export default function AttestationProof() {
  const [status, setStatus] = useState<"idle" | "fetching" | "challenge" | "generating" | "finish">("idle")
  const [error, setError] = useState<string | null>(null)
  const [proof, setProof] = useState<ProofData | null>(null);
  const { data: walletClient } = useWalletClient()
  const address = "0xe1A6db7fF4a99ff36DEFBc6403200C8aF7F291D7"; // address of the Coinbase verified account
  const COINBASE_VERIFIED_ACCOUNT_SCHEMA_ID = '0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9';

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        initACVM(fetch(acvm)),
        initNoirC(fetch(noirc)),
      ])
    };
    init();
  }, []);

  type ExtendedAttestation = Awaited<ReturnType<typeof getAttestations>>[number] & {
    txid?: string;
  };

  const fetchTxAndGenerateProof = async () => {
    setStatus("fetching");
    setProof(null);
    setError(null);
  
    try {
      const attestations = await getAttestations(
        address as `0x${string}`,
        base as any,
        { schemas: [COINBASE_VERIFIED_ACCOUNT_SCHEMA_ID] }
      ) as ExtendedAttestation[];
  
      console.log('Attestations:', attestations);
  
      if (!attestations || attestations.length === 0) {
        setError("No attestations found");
        setStatus("idle");
        return;
      }
  
      const txHash = attestations[0]?.txid;
      console.log('txHash:', txHash);
  
      if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
        setError('Invalid or missing txHash in attestation');
        setStatus("idle");
        return;
      }
  
      const res = await fetch(
        `https://api.basescan.org/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${VITE_PUBLIC_BASE_API_KEY}`
      );
      const data = await res.json();
      const tx = data?.result;
      console.log('Transaction:', tx);
  
      if (!tx || !tx.input || !tx.r || !tx.s || !tx.v || !tx.from) {
        setError('Invalid or missing transaction data from Basescan API');
        setStatus("idle");
        return;
      }
  
      setStatus("challenge");
      const { from, input } = tx;
      const calldataBytes = Array.from(getBytes(input));
  
      const { txSignature, txPubKeyX, txPubKeyY, txHashBytes } = parseTxInputs(tx);
      const { userSignature, userPubKeyX, userPubKeyY, nonceHashBytes, timestampHashBytes } = await parseUserChallenge();
  
      const inputs = {
        attester_pub_key_x: txPubKeyX,
        attester_pub_key_y: txPubKeyY,
        attester_signature: txSignature,
        hashed_attestation_tx: txHashBytes,
        expected_attester: from,
        user_pub_key_x: userPubKeyX,
        user_pub_key_y: userPubKeyY,
        user_signature: userSignature,
        nonce_hash: nonceHashBytes,
        timestamp_hash: timestampHashBytes,
        calldata: calldataBytes,
      };
  
      setStatus("generating");
  
      const compiledProgram = (await import('../../../public/zk_coinbase_attestation.json')).default as CompiledCircuit;
      const noir = new Noir(compiledProgram);
      const backend = new UltraHonkBackend(compiledProgram.bytecode);
      const { witness } = await noir.execute(inputs);
      const result = await backend.generateProof(witness);
      setProof(result);
      setStatus("finish");
  
    } catch (err) {
      console.error('Error in fetchTxAndGenerateProof:', err);
      setStatus("idle");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const parseUserChallenge = async () => {
    if (!walletClient) throw new Error('No wallet client');
    const provider = new BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();
    const nonce = uuidv4();

    const nonceHash = keccak256(toUtf8Bytes(nonce));
    const timestampHash = keccak256(toUtf8Bytes(Date.now().toString()));

    const nonceHashBytes = getBytes(nonceHash);
    const timestampHashBytes = getBytes(timestampHash);

    const digest = keccak256(new Uint8Array([
      ...nonceHashBytes,
      ...timestampHashBytes
    ]));

    if (!digest) {
      throw new Error("Digest is null or undefined");
    }

    const sig = await walletClient.signMessage({
      account: await signer.getAddress() as `0x${string}`,
      message: digest
    });

    const signature = Signature.from(sig);
    const userSignature = [...getBytes(signature.r), ...getBytes(signature.s)];
    const prefixedMessage = keccak256(new Uint8Array([
      ...toUtf8Bytes("\x19Ethereum Signed Message:\n32"),
      ...getBytes(digest)
    ]));

    const pubKeyHex = SigningKey.recoverPublicKey(prefixedMessage, sig);
    const pubKeyBytes = getBytes(pubKeyHex);
    const userPubKeyX = Array.from(pubKeyBytes.slice(1, 33));
    const userPubKeyY = Array.from(pubKeyBytes.slice(33, 65));
    return {
      userSignature, userPubKeyX, userPubKeyY,
      nonceHashBytes: Array.from(nonceHashBytes),
      timestampHashBytes: Array.from(timestampHashBytes),
    };
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

  return (
    <div className="flex flex-1 flex-col justify-center items-center w-full bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 pt-10">ZK Coinbase Attestation Project</h1>
        <p className="text-gray-600 text-base">
          This process fetches the Base transaction used in your Coinbase attestation and generates a zk proof asserting both your verification status and wallet ownership.
        </p>
        <button
          onClick={fetchTxAndGenerateProof}
          disabled={status !== "idle" && status !== "finish"}
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