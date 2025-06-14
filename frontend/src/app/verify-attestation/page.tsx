'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Transaction, recoverAddress, getAddress, toBeHex, toBigInt,
  keccak256, toBeArray, Signature
} from 'ethers'
import * as circomlib from 'circomlibjs'
import { v4 as uuidv4 } from 'uuid'
import { useWalletClient } from 'wagmi'
import { BrowserProvider } from 'ethers'

const NEXT_PUBLIC_BASE_API_KEY = process.env.NEXT_PUBLIC_BASE_API_KEY;

export default function ProveAttestationPage() {
    const [loading, setLoading] = useState(false)
    const { data: walletClient } = useWalletClient()

  const fetchTxData = async () => {
    setLoading(true)

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

      const { to, from, input } = tx;

      const recovered = recoverSignerFromTx(tx)
      console.log('✅ Recovered signer:', recovered);

      if (recovered.toLowerCase() !== from.toLowerCase()) {
        console.error('❌ Firma no válida o no proviene de `from`')
        return
      }

      const functionSelector = input.slice(0, 10) // 4 bytes + 0x
      const userAddress = `0x${input.slice(34)}` // los últimos 20 bytes (32 bytes = 64 hex digits, después del selector)

      console.log('🧠 Function selector:', functionSelector)
      console.log('🙋‍♂️ User Address (atestado):', userAddress)

      if (!walletClient) throw new Error('No wallet client')
      const provider = new BrowserProvider(walletClient.transport)
      const signer = await provider.getSigner()
      const nonce = uuidv4()
      const sig = await signer.signMessage(nonce)
      
      const signature = Signature.from(sig)

      console.log('r:', signature.r)
      console.log('s:', signature.s)
      console.log('v:', signature.v)
      /*
      const inputsForCircuit = {
        user_address: BigInt(userAddress).toString(),
        contract_address: BigInt(to).toString(),
        function_selector: BigInt(functionSelector).toString(),
        hash: hashString,
        signature_R8x: signature.R8[0].toString(),
        signature_R8y: signature.R8[1].toString(),
        signature_S: signature.S.toString(),
        signer_x: pubKey[0].toString(),
        signer_y: pubKey[1].toString()
      }
      console.log("5");
      console.log('✅ Inputs para el circuito:', inputsForCircuit)
      */
    } catch (err) {
      console.error('❌ Error:', err)
    } finally {
      setLoading(false)
    }
  }

  function recoverSignerFromTx(tx: any) {
    console.log('✅ Tx:', tx)
    console.log('✅ From:', tx.from)
    console.log('✅ To:', tx.to)
    console.log('📨 Input (calldata):', tx.input)
    
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

    return getAddress(recoverAddress(digest, sig))
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