import './App.css'
import { openZkKycPopup } from 'zk-access-coinbase'

function App() {
  
  return (
    <>
      <button onClick={() => openZkKycPopup()}>Open ZK KYC Popup</button>
    </>
  )
}

export default App
