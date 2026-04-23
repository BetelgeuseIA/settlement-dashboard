import { ReactNode } from 'react';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
// import { ConvexProviderWithClerk } from 'convex/react-clerk';
// import { ClerkProvider, useAuth } from '@clerk/clerk-react';

/**
 * Determines the Convex deployment to use.
 *
 * We perform load balancing on the frontend, by randomly selecting one of the available instances.
 * We use localStorage so that individual users stay on the same instance.
 */
function convexUrl(): string | null {
  const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
  return url || null;
}

const convexUrlValue = convexUrl();
const convex = convexUrlValue
  ? new ConvexReactClient(convexUrlValue, { unsavedChangesWarning: false })
  : null;

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <div className="min-h-screen bg-[#05070b] text-white flex items-center justify-center p-6">
        <div className="max-w-xl rounded-2xl border border-red-500/20 bg-white/5 p-6 text-center">
          <h1 className="text-2xl font-semibold">Dashboard no configurado todavía</h1>
          <p className="mt-3 text-sm text-white/70">
            La web ya está publicada, pero falta conectar la variable <code>VITE_CONVEX_URL</code>{' '}
            en producción para traer los datos vivos del settlement.
          </p>
          <p className="mt-3 text-sm text-white/50">
            El frontend ya no debería verse negro: ahora muestra este estado explícitamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexProvider client={convex}>{children}</ConvexProvider>
  );
}
