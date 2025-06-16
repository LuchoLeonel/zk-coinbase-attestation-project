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
    const [loading, setLoading] = useState(false)
    const { data: walletClient } = useWalletClient()
    const { address } = useAccount();
    const COINBASE_VERIFIED_ACCOUNT_SCHEMA_ID = '0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9';
    

  const fetchTxData = async () => {
    setLoading(true)

    const result = await getAttestations(
      address as `0x${string}`,
      base as any, 
      {
        schemas: [COINBASE_VERIFIED_ACCOUNT_SCHEMA_ID],
      }
    );

    console.log(result);

    try {
      const txHash = "0x88d12f3f06f9f82e33c695b26fa9ebdb8b84e322d75fb459e21cd6c4f468e8c3"

      const res = await fetch(
        `https://api-sepolia.basescan.org/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${NEXT_PUBLIC_BASE_API_KEY}`
      )

      const data = await res.json()
      const tx = data?.result

      if (!tx) {
        console.warn('⚠️ No result found')
        return
      }

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
      
      try {
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

      } catch (error) {
        console.error(error)
      }

    } catch (err) {
      console.error('❌ Error:', err)
    } finally {
      setLoading(false)
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
            <h1 className="text-3xl font-bold text-gray-900">ZK Attestation Debug Panel</h1>

            <p className="text-gray-600 text-base">
                Press the button below to fetch and inspect the Base transaction used in
                the Coinbase attestation flow.
            </p>

            <Button
                onClick={fetchTxData}
                disabled={loading}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-md text-lg transition"
            >
                {loading ? 'Loading...' : 'Fetch Attestation Transaction'}
            </Button>
            </div>
        </div>
    )
}