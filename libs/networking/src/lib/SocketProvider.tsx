import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { SocketClient } from './socket-client';

interface SocketProviderProps {
  baseUrl: string;
  token: string;
  children: React.ReactNode;
}

const SocketClientContext = createContext<SocketClient | null>(null);

/**
 * Provides a SocketClient instance via React context.
 *
 * Wrap your app (or the multiplayer section) with this provider to give
 * child components access to the shared SocketClient.
 */
export function SocketProvider({ baseUrl, token, children }: SocketProviderProps) {
  const client = useMemo(() => new SocketClient(baseUrl, token), [baseUrl, token]);

  // Clean up all connections when the provider unmounts
  useEffect(() => {
    return () => {
      client.disconnectAll();
    };
  }, [client]);

  // Update token if it changes
  useEffect(() => {
    client.updateToken(token);
  }, [client, token]);

  return (
    <SocketClientContext.Provider value={client}>
      {children}
    </SocketClientContext.Provider>
  );
}

/**
 * Get the SocketClient instance from context.
 * Must be used within a <SocketProvider>.
 */
export function useSocketClient(): SocketClient {
  const client = useContext(SocketClientContext);
  if (!client) {
    throw new Error('useSocketClient must be used within a <SocketProvider>');
  }
  return client;
}
