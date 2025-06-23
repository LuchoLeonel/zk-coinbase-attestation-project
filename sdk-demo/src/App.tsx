import './App.css'
import { openZkKycPopup } from 'zk-access-coinbase'

function App() {
  const handleOpenPopup = async () => {
    try {
      console.log('Opening ZK KYC popup...');
      const result = await openZkKycPopup();
      console.log('Received proof:', result);
      // Handle the successful proof here
    } catch (error) {
      console.error('Error getting proof:', error);
      // Handle the error here
    }
  };
  
  return (
    <>
      <button onClick={handleOpenPopup}>Open ZK KYC Popup</button>
    </>
  )
}

export default App
