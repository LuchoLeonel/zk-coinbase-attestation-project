import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SdkDemo } from './components/SdkDemo';
import './App.css';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex w-full">
          <SdkDemo />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;
