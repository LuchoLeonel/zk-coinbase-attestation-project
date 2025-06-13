'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

const NEXT_PUBLIC_BASE_API_KEY = process.env.NEXT_PUBLIC_BASE_API_KEY;

export default function ProveAttestationPage() {
    const [loading, setLoading] = useState(false)
    const fetchTxData = async () => {
        setLoading(true)
        try {
        const txHash = "0x9af14def4577085672c7f0b7352cc9230c823ac305d185b62dfaab97f680a241"

        const res = await fetch(
        `https://api.basescan.org/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${NEXT_PUBLIC_BASE_API_KEY}`
        )

        const data = await res.json()
        console.log('📦 Full transaction data:', data)

        if (data?.result) {
            const { from, to, input, hash, value, blockNumber } = data.result
            console.log('✅ From:', from)
            console.log('✅ To:', to)
            console.log('📨 Input (calldata):', input)
            console.log('🔑 Hash:', hash)
            console.log('💰 Value:', value)
            console.log('📦 Block Number:', blockNumber)
        } else {
            console.warn('⚠️ No result found')
        }
        } catch (error) {
        console.error('❌ Error fetching transaction:', error)
        } finally {
        setLoading(false)
        }
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