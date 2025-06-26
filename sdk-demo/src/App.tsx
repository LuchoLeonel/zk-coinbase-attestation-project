import { useState } from 'react';
import './App.css'
import { openZkKycPopup, validateProof } from 'zk-access-coinbase'

function App() {
  const [proof, setProof] = useState()
  const [publicInputs, setPublicInputs] = useState<string[]>()


  const handleOpenPopup = async () => {
    try {
      console.log('Opening ZK KYC popup...');
      const result = await openZkKycPopup();
      setProof(result.proof)
      setPublicInputs(result.publicInputs)
      
      console.log('Received proof:', result);
      // Handle the successful proof here

      const validation_result = await validateProof(result)
      
      console.log("validation_result", validation_result)
    } catch (error) {
      console.error('Error getting proof:', error);
      // Handle the error here
    }
  };
  
  return (
    <>
      <button onClick={handleOpenPopup}>Open ZK KYC Popup</button>

      {/* Displlay proof and public inputs */}
      {proof ? proof : "No proof"}
      {publicInputs ? publicInputs : "No publicInputs"}
    </>
  )
}

export default App
