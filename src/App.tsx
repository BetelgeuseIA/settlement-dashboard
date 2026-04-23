import Game from './components/Game.tsx';

import { ToastContainer } from 'react-toastify';
import { useState } from 'react';
import ReactModal from 'react-modal';
import { MAX_HUMAN_PLAYERS } from '../convex/constants.ts';
import PoweredByConvex from './components/PoweredByConvex.tsx';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import SettlementDashboard from './components/dashboard/SettlementDashboard.tsx';

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between font-body game-background">
      <PoweredByConvex />

      <ReactModal
        isOpen={helpModalOpen}
        onRequestClose={() => setHelpModalOpen(false)}
        style={modalStyles}
        contentLabel="Help modal"
        ariaHideApp={false}
      >
        <div className="font-body">
          <h1 className="text-center text-6xl font-bold font-display game-title">Help</h1>
          <p>
            Welcome to AI town. AI town supports both anonymous <i>spectators</i> and logged in{' '}
            <i>interactivity</i>.
          </p>
          <h2 className="text-4xl mt-4">Spectating</h2>
          <p>
            Click and drag to move around the town, and scroll in and out to zoom. You can click on
            an individual character to view its chat history.
          </p>
          <h2 className="text-4xl mt-4">Interactivity</h2>
          <p>
            If you log in, you can join the simulation and directly talk to different agents! After
            logging in, click the "Interact" button, and your character will appear somewhere on the
            map with a highlighted circle underneath you.
          </p>
          <p className="text-2xl mt-2">Controls:</p>
          <p className="mt-4">Click to navigate around.</p>
          <p className="mt-4">
            To talk to an agent, click on them and then click "Start conversation," which will ask
            them to start walking towards you. Once they're nearby, the conversation will start, and
            you can speak to each other. You can leave at any time by closing the conversation pane
            or moving away. They may propose a conversation to you - you'll see a button to accept
            in the messages panel.
          </p>
          <p className="mt-4">
            AI town only supports {MAX_HUMAN_PLAYERS} humans at a time. If you're idle for five
            minutes, you'll be automatically removed from the simulation.
          </p>
        </div>
      </ReactModal>
      {/*<div className="p-3 absolute top-0 right-0 z-10 text-2xl">
        <Authenticated>
          <UserButton afterSignOutUrl="/ai-town" />
        </Authenticated>

        <Unauthenticated>
          <LoginButton />
        </Unauthenticated>
      </div> */}

      <div className="w-full min-h-screen relative isolate overflow-hidden lg:p-8 shadow-2xl flex flex-col justify-start">
        <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-0">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-4 sm:p-6 backdrop-blur-md">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Settlement Sim</div>
                <h1 className="mt-2 text-3xl sm:text-5xl lg:text-7xl font-bold font-display leading-none tracking-wide game-title">
                  Ciudad de IA
                </h1>
                <p className="mt-3 max-w-2xl text-sm sm:text-lg text-white/80 leading-relaxed">
                  Panel vivo del settlement: recursos, hogares, agentes, crisis y tensión social,
                  hecho para verse bien en móvil.
                </p>
              </div>
              <div className="pt-2 lg:text-right">
                <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
                  Dashboard en vivo
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 w-full max-w-[1400px] px-4 sm:px-6 lg:px-0">
          {worldId ? <SettlementDashboard worldId={worldId} /> : null}
        </div>

        <div className="mx-auto mt-4 w-full max-w-[1400px] px-4 pb-4 sm:px-6 lg:px-0">
          <Game />
        </div>

        <footer className="justify-between bottom-0 left-0 w-full flex items-center mt-2 gap-3 px-6 pb-6 pt-2 flex-wrap text-xs text-white/45">
          <div>Betelgeuse IA · Settlement Dashboard</div>
          <button className="pointer-events-auto text-white/60 hover:text-white" onClick={() => setHelpModalOpen(true)}>
            Ver ayuda
          </button>
        </footer>
        <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
      </div>
    </main>
  );
}

const modalStyles = {
  overlay: {
    backgroundColor: 'rgb(0, 0, 0, 75%)',
    zIndex: 12,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '50%',

    border: '10px solid rgb(23, 20, 33)',
    borderRadius: '0',
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
  },
};
