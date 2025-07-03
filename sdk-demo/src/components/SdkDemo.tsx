import { useState } from 'react';
import { openZkKycPopup, validateProof } from 'zk-access-coinbase';

export const SdkDemo = () => {
  const [proof, setProof] = useState<any>(null);
  const [publicInputs, setPublicInputs] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleOpenPopup = async () => {
    setIsLoading(true);
    setError(null);
    setValidationResult(null);
    
    try {
      console.log('Opening ZK KYC popup...');
      const result = await openZkKycPopup();
      setProof(result.proof);
      setPublicInputs(result.publicInputs);
      
      console.log('Received proof:', result);


      const proof_bytes = Uint8Array.from(Buffer.from(result.proof, "base64"));

      console.log("proof_bytes", proof_bytes);
      const validation_result = await validateProof({
        proof: proof_bytes,
        publicInputs: result.publicInputs,
      });
      
      setValidationResult(validation_result);

      console.log("validation_result", validation_result);
    } catch (error) {
      console.error('Error getting proof:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-200">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              ZK Access SDK Demo
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Test the zk-access-coinbase SDK integration. Click the button below to open the ZK KYC popup and generate a zero-knowledge proof.
            </p>
          </div>

          <div className="flex justify-center mb-6 sm:mb-8">
            <button
              onClick={handleOpenPopup}
              disabled={isLoading}
              className={`px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold rounded-lg sm:rounded-xl transition-all duration-200 w-full sm:w-auto ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-gray-800 hover:shadow-lg'
              } text-white`}
            >
              {isLoading ? 'Processing...' : 'Open ZK KYC Popup'}
            </button>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold mb-2 text-sm sm:text-base">Error</h3>
              <p className="text-red-700 text-sm sm:text-base break-words">{error}</p>
            </div>
          )}

          {proof && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <h3 className="text-green-800 font-semibold mb-2 text-sm sm:text-base">✓ Proof Generated Successfully</h3>
                <p className="text-green-700 text-sm sm:text-base">The ZK proof has been generated and is ready for validation.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-gray-900 font-semibold mb-3 text-sm sm:text-base">Proof Data</h3>
                  <div className="bg-gray-100 rounded p-2 sm:p-3 text-xs sm:text-sm font-mono text-gray-800 overflow-x-auto max-h-64 sm:max-h-96">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(proof, null, 2)}</pre>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-gray-900 font-semibold mb-3 text-sm sm:text-base">Public Inputs</h3>
                  <div className="bg-gray-100 rounded p-2 sm:p-3 text-xs sm:text-sm font-mono text-gray-800 overflow-x-auto max-h-64 sm:max-h-96">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(publicInputs, null, 2)}</pre>
                  </div>
                </div>
              </div>

              {validationResult && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h3 className="text-blue-800 font-semibold mb-2 text-sm sm:text-base">Validation Result</h3>
                  <div className="bg-blue-100 rounded p-2 sm:p-3 text-xs sm:text-sm font-mono text-blue-800 overflow-x-auto max-h-64 sm:max-h-96">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(validationResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {!proof && !isLoading && !error && (
            <div className="text-center text-gray-500">
              <p className="text-sm sm:text-base">Click the button above to start the ZK proof generation process.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 