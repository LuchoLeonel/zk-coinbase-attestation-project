'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Transaction, recoverAddress, getAddress, toBeHex, toBigInt, Wallet,
  keccak256, toBeArray, Signature, getBytes, SigningKey, toUtf8Bytes
} from 'ethers'
import * as circomlib from 'circomlibjs'
import { v4 as uuidv4 } from 'uuid'
import { useWalletClient } from 'wagmi'
import { BrowserProvider } from 'ethers'
import { getAttestations } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';
import { useAccount } from 'wagmi'


const NEXT_PUBLIC_BASE_API_KEY = process.env.NEXT_PUBLIC_BASE_API_KEY;

export default function ProveAttestationPage() {
    const [status, setStatus] = useState<"idle" | "fetching" | "challenge" | "generating" | "finish">("idle")
    const [error, setError] = useState<string | null>(null)
    const [proof, setProof] = useState(null);
    const { data: walletClient } = useWalletClient()
    const { address } = useAccount();
    const COINBASE_VERIFIED_ACCOUNT_SCHEMA_ID = '0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9';

    // Define extended attestation type to include blockTransactionHash
    type ExtendedAttestation = Awaited<ReturnType<typeof getAttestations>>[number] & {
      txid?: string;
    };

  const fetchTxAndGenerateProof = async () => {
    setStatus("fetching")
    setProof(null);
    setError(null);

    try {
      const attestations = await getAttestations(
        address as `0x${string}`,
        base as any,
        {
          schemas: [COINBASE_VERIFIED_ACCOUNT_SCHEMA_ID],
        }
      ) as ExtendedAttestation[];
      
      if (!attestations || attestations.length === 0) {
        setError("No attestations found")
        setStatus("idle");
        return;
      }
      
      const txHash = attestations[0]?.txid;
      if (!txHash) {
        setError('No txHash found in attestation');
        setStatus("idle");
        return;
      }

      const res = await fetch(
        `https://api.basescan.org/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${NEXT_PUBLIC_BASE_API_KEY}`
      )
      const data = await res.json()
      const tx = data?.result

      if (!tx) {
        setError('No tx found on Base explorer')
        setStatus("idle");
        return;
      }

      setStatus("challenge");
      const { from, input } = tx;

      console.log('✅ Calldata:', input);
      const calldataBytes = Array.from(getBytes(input));

      const functionSelector = input.slice(0, 10) // 4 bytes + 0x
      const userAddress = `0x${input.slice(34)}` // los últimos 20 bytes (32 bytes = 64 hex digits, después del selector)
      console.log('🧠 Function selector:', functionSelector)
      console.log('🙋‍♂️ User Address (atestado):', userAddress)

      const { txSignature, txPubKeyX, txPubKeyY, txHashBytes } = parseTxInputs(tx)
      //console.log('✅ Expected Attester:', recovered);
      console.log('✅ Transaction Signature:', txSignature);
      console.log('✅ Transaction Hash:', txHashBytes);
      console.log('✅ Transaction Signer X:', txPubKeyX);
      console.log('✅ Transaction Signer Y:', txPubKeyY);

      const { userSignature, userPubKeyX,  userPubKeyY, signedUserHash } = await parseUserChallenge();
      console.log('✅ User Signature:', userSignature);
      console.log('✅ User Hash:', signedUserHash);
      console.log('✅ User Signer X:', userPubKeyX);
      console.log('✅ User Signer Y:', userPubKeyY);
      
      setStatus("generating");
      const backendRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/zk/generate-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attester_pub_key_x: txPubKeyX,
          attester_pub_key_y: txPubKeyY,
          attester_signature: txSignature,
          hashed_attestation_tx: txHashBytes,
          expected_attester: from,
          user_pub_key_x: userPubKeyX,
          user_pub_key_y: userPubKeyY,
          user_signature: userSignature,
          signed_user_hash: signedUserHash,
          calldata: calldataBytes,
        })
      });

      const result = await backendRes.json();
      console.log('✅ zkProof:', result.proof);
      setProof(result.proof);
      setStatus("finish");

    } catch (err) {
      setStatus("idle");
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'string') {
        setError(err)
      } else {
        setError('Ocurrió un error desconocido')
      }
    }
  }

  const parseUserChallenge = async () => {
    if (!walletClient) throw new Error('No wallet client');

    const provider = new BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();
    const nonce = uuidv4();

    const digest = keccak256(toUtf8Bytes(nonce));
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

    const signedUserHash = Array.from(getBytes(prefixedMessage));

    const pubKeyHex = SigningKey.recoverPublicKey(prefixedMessage, sig);
    const pubKeyBytes = getBytes(pubKeyHex);
    const userPubKeyX = Array.from(pubKeyBytes.slice(1, 33));
    const userPubKeyY = Array.from(pubKeyBytes.slice(33, 65));

    return { userSignature, userPubKeyX, userPubKeyY, signedUserHash };
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
    }

    const fullTx = Transaction.from(unsignedTx)
    const rawBytes = toBeArray(fullTx.unsignedSerialized)
    const digest = keccak256(rawBytes)
    const sig = Signature.from({
      r: tx.r,
      s: tx.s,
      v: parseInt(tx.v) % 27
    })
  
    //const recovered = getAddress(recoverAddress(digest, sig));

    const rBytes = getBytes(sig.r); 
    const sBytes = getBytes(sig.s);
    const txSignature = [...rBytes, ...sBytes];

    const pubKeyHex = SigningKey.recoverPublicKey(digest, sig);
    const pubKeyBytes = getBytes(pubKeyHex); 
    const txPubKeyX = Array.from(pubKeyBytes.slice(1, 33));
    const txPubKeyY = Array.from(pubKeyBytes.slice(33, 65));

    const txHashBytes = Array.from(getBytes(digest));

    return {txSignature, txPubKeyX, txPubKeyY, txHashBytes}
  }


    return (
        <div className="flex flex-1 flex-col justify-center items-center w-full bg-gradient-to-b from-gray-50 to-gray-100 px-4">
            <div className="max-w-2xl w-full text-center space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">ZK Coinbase Attestation Project</h1>

           <p className="text-gray-600 text-base">
              This process fetches the Base transaction used in your Coinbase attestation and generates a zk proof asserting both your verification status and wallet ownership.
            </p>
            <Button
                onClick={fetchTxAndGenerateProof}
                disabled={(status !== "idle" && status !== "finish")}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105"
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
            </Button>

            <div className="h-5">
              {error && (
                <div className="mt-4 text-red-600 text-sm bg-red-100 p-2 rounded-md border border-red-200">
                  {error}
                </div>
              )}
            </div>

            {proof && (
              <div className="bg-gray-100 p-4 rounded overflow-x-auto text-sm text-gray-800 border border-gray-300 break-all">
                {JSON.stringify(proof)}
              </div>
            )}
          </div>
        </div>
    )
}