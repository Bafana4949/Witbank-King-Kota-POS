import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { POSProvider } from './context/POSContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <POSProvider>
      <App />
    </POSProvider>
  </StrictMode>,
);
