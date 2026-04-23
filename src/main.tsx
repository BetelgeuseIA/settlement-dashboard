import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import App from './App';
import './index.css';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

function Root() {
  if (!convexUrl) {
    return (
      <main className="min-h-screen bg-[#05070c] px-4 py-8 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-400/20 bg-red-500/10 p-5">
          <div className="text-sm font-semibold text-red-200">Configuración incompleta</div>
          <p className="mt-2 text-sm text-white/80">
            Falta VITE_CONVEX_URL en producción. El dashboard no puede conectar con datos.
          </p>
        </div>
      </main>
    );
  }

  const convex = new ConvexReactClient(convexUrl);

  return (
    <React.StrictMode>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
