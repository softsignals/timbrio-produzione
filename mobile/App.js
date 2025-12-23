import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { UsersProvider } from './src/context/UsersContext';
import { TimbratureProvider } from './src/context/TimbratureContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { DocumentiProvider } from './src/context/DocumentiContext';
import { ComunicazioniProvider } from './src/context/ComunicazioniContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

/**
 * Timbrio DEMO - Sistema di Gestione Presenze
 * 
 * Versione DEMO semplificata con:
 * - Dashboard riepilogativa
 * - Timbrature
 * - Gestione documenti
 * - Impostazioni profilo
 * - Dark mode
 * - Gestione dipendenti (per manager)
 * - Sistema QR (per receptionist)
 * - Comunicazioni aziendali con conferme di lettura
 * 
 * Database: Supabase (PostgreSQL)
 * Storage: Supabase Storage
 */
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <UsersProvider>
            <TimbratureProvider>
              <DocumentiProvider>
                <ComunicazioniProvider>
                  <AppNavigator />
                </ComunicazioniProvider>
              </DocumentiProvider>
            </TimbratureProvider>
          </UsersProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
