import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress harmless Vite HMR WebSocket connection messages in iframe / cloud proxy environments
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = typeof reason === "string" ? reason : reason?.message;
    if (msg && (msg.includes("WebSocket closed without opened") || msg.includes("[vite]"))) {
      event.preventDefault();
    }
  });

  // Promptly check for updated service workers on page load
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.update();
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
