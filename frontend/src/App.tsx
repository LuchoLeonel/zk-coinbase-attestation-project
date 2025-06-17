import { Header } from './components/Header/Header';
import { Footer } from './components/Footer/Footer';
import AttestationProof from './components/AttestationProof/AttestationProof';


function App() {
  return (
    <div className="min-h-screen flex flex-col">
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex">
            <AttestationProof />
          </main>
          <Footer />
        </div>
    </div>
  );
}

export default App;