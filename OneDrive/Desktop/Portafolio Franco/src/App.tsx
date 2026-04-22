import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ProyectosPage } from './pages/ProyectosPage';
import { SobreMiPage } from './pages/SobreMiPage';
import { ContactoPage } from './pages/ContactoPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0D1117] text-white noise">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/proyectos" element={<ProyectosPage />} />
            <Route path="/sobre-mi" element={<SobreMiPage />} />
            <Route path="/contacto" element={<ContactoPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;