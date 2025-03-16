import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { HttpLog } from '@shared/schema';

export function useWebSocket() {
  const [logs, setLogs] = useState<HttpLog[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'initial') {
          setLogs(message.data);
        } else if (message.type === 'update') {
          setLogs(prev => {
            const newLogs = [message.data, ...prev];
            return newLogs.slice(0, 100); // Keep only last 100 logs
          });
        }
      };

      wsRef.current.onclose = () => {
        toast({
          title: "WebSocket disconnected",
          description: "Attempting to reconnect...",
          variant: "destructive",
        });

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Don't close the connection on unmount to persist across page navigation
    };
  }, [toast]);

  return { logs };
}
