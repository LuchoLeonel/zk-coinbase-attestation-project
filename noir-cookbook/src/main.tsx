import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import WalletProvider from './components/WalletProvider/WalletProvider.tsx'
import './index.css'
import App from './App.tsx'
import "./i18n";
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </StrictMode>,
)
