import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useSocketClient } from './SocketProvider';

type Namespace = '/' | '/game' | '/lobby' | '/chat' | '/presence';

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  latency: number;
  emit: (event: string, data?: unknown, ack?: (...args: unknown[]) => void) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler?: (...args: unknown[]) => void) => void;
}

/**
 * React hook for connecting to a Socket.IO namespace.
 *
 * Auto-connects on mount, auto-disconnects on unmount, and cleans up listeners.
 */
export function useSocket(namespace: Namespace): UseSocketReturn {
  const client = useSocketClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const listenersRef = useRef<Map<string, Set<(...args: unknown[]) => void>>>(new Map());
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Connect on mount
  useEffect(() => {
    if (!client) return;

    const s = client.connect(namespace);
    setSocket(s);
    setIsConnected(s.connected);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);

    // Latency measurement via ping/pong
    pingIntervalRef.current = setInterval(() => {
      if (s.connected) {
        const start = Date.now();
        s.volatile.emit('ping', () => {
          setLatency(Date.now() - start);
        });
      }
    }, 5_000);

    return () => {
      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Remove all tracked listeners
      listenersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          s.off(event, handler);
        });
      });
      listenersRef.current.clear();

      // Remove our own handlers
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);

      // Disconnect from namespace
      client.disconnect(namespace);
      setSocket(null);
      setIsConnected(false);
    };
  }, [client, namespace]);

  const emit = useCallback(
    (event: string, data?: unknown, ack?: (...args: unknown[]) => void) => {
      if (!socket?.connected) {
        console.warn(`[useSocket] Cannot emit "${event}" - not connected to ${namespace}`);
        return;
      }
      if (ack) {
        socket.emit(event, data, ack);
      } else {
        socket.emit(event, data);
      }
    },
    [socket, namespace],
  );

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      if (!socket) return;

      socket.on(event, handler);

      // Track listener for cleanup
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event)!.add(handler);
    },
    [socket],
  );

  const off = useCallback(
    (event: string, handler?: (...args: unknown[]) => void) => {
      if (!socket) return;

      if (handler) {
        socket.off(event, handler);
        listenersRef.current.get(event)?.delete(handler);
      } else {
        socket.off(event);
        listenersRef.current.delete(event);
      }
    },
    [socket],
  );

  return { socket, isConnected, latency, emit, on, off };
}
