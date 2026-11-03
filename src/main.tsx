import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { InspectorProvider } from './context/InspectorContext';
import { ThemeProvider } from './context/ThemeContext';
import { injectSpeedInsights } from '@vercel/speed-insights';
import App from './App';
import './styles/global.css';

injectSpeedInsights();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <InspectorProvider>
          <App />
        </InspectorProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
