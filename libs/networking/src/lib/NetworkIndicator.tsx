import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { NetworkQuality } from './network-quality';
import { NetworkQualityMonitor } from './network-quality';
import { useSocket } from './useSocket';

const QUALITY_COLORS: Record<NetworkQuality, string> = {
  good: '#22C55E',   // green
  fair: '#EAB308',   // yellow
  poor: '#EF4444',   // red
};

const QUALITY_LABELS: Record<NetworkQuality, string> = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

interface NetworkIndicatorProps {
  /** Show latency text next to the indicator dot */
  showLatency?: boolean;
  /** Show expanded details on press */
  expandable?: boolean;
  /** Custom style for the container */
  style?: object;
}

/**
 * React Native component that shows network quality as a colored dot.
 *
 * - Green dot: < 100ms latency (good)
 * - Yellow dot: 100-300ms latency (fair)
 * - Red dot: > 300ms latency (poor)
 *
 * Optionally shows latency text and expanded connection details on press.
 */
export function NetworkIndicator({
  showLatency = true,
  expandable = true,
  style,
}: NetworkIndicatorProps) {
  const { socket, isConnected, latency: socketLatency } = useSocket('/game');
  const [quality, setQuality] = useState<NetworkQuality>('good');
  const [latency, setLatency] = useState(0);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [expanded, setExpanded] = useState(false);
  const [monitor] = useState(() => new NetworkQualityMonitor());

  // Start monitoring when socket is connected
  useEffect(() => {
    if (!socket || !isConnected) return;

    monitor.startMonitoring(socket);

    const unsub = monitor.onQualityChange((q, l) => {
      setQuality(q);
      setLatency(l);
    });

    // Get connection type
    monitor.getConnectionType().then(setConnectionType);

    return () => {
      unsub();
      monitor.stopMonitoring();
    };
  }, [socket, isConnected, monitor]);

  // Fallback to socket hook latency if monitor hasn't reported yet
  useEffect(() => {
    if (latency === 0 && socketLatency > 0) {
      setLatency(socketLatency);
    }
  }, [socketLatency, latency]);

  const dotColor = isConnected ? QUALITY_COLORS[quality] : '#6B7280'; // gray if disconnected
  const qualityLabel = isConnected ? QUALITY_LABELS[quality] : 'Disconnected';

  const content = (
    <View style={[styles.container, style]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      {showLatency && isConnected && (
        <Text style={styles.latencyText}>{latency}ms</Text>
      )}
      {!isConnected && (
        <Text style={styles.disconnectedText}>Offline</Text>
      )}
    </View>
  );

  if (!expandable) {
    return content;
  }

  return (
    <View>
      <Pressable onPress={() => setExpanded(!expanded)}>
        {content}
      </Pressable>
      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detailText}>
            Status: {qualityLabel}
          </Text>
          <Text style={styles.detailText}>
            Latency: {isConnected ? `${latency}ms` : 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            Connection: {connectionType}
          </Text>
          <Text style={styles.detailText}>
            Transport: {isConnected ? 'WebSocket' : 'None'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  latencyText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontVariant: ['tabular-nums'],
  },
  disconnectedText: {
    fontSize: 12,
    color: '#EF4444',
  },
  details: {
    position: 'absolute',
    top: 24,
    right: 0,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    minWidth: 180,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#E5E7EB',
    marginBottom: 4,
  },
});
