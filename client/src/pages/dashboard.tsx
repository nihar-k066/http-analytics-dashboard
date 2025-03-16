import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { HttpLog } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [realtimeLogs, setRealtimeLogs] = useState<HttpLog[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Setup WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'initial') {
        setRealtimeLogs(message.data);
      } else if (message.type === 'update') {
        setRealtimeLogs(prev => {
          const newLogs = [message.data, ...prev];
          return newLogs.slice(0, 100); // Keep only last 100 logs
        });
      }
    };

    wsRef.current.onclose = () => {
      toast({
        title: "WebSocket disconnected",
        description: "Real-time updates paused. Please refresh the page.",
        variant: "destructive",
      });
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [toast]);

  const { data: logs, isLoading } = useQuery<HttpLog[]>({
    queryKey: ["/api/logs", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/logs?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayLogs = realtimeLogs.length > 0 ? realtimeLogs : (logs || []);

  const groupedLogs = displayLogs.reduce((acc, log) => {
    const firstDigit = Math.floor(log.statusCode / 100);
    const key = `${firstDigit}xx`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCodeDescriptions: Record<string, string> = {
    '2xx': 'Success Responses',
    '3xx': 'Redirection Messages',
    '4xx': 'Client Error Responses',
    '5xx': 'Server Error Responses'
  };

  const chartData = Object.entries(groupedLogs || {}).map(([name, value]) => ({
    name,
    value,
    description: statusCodeDescriptions[name] || 'Other Responses'
  }));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const recentAlerts = displayLogs
    .filter((log) => log.statusCode >= 400)
    .slice(0, 10)
    .sort((a, b) => b.statusCode - a.statusCode);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">HTTP Analytics Dashboard</h1>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-wrap gap-4">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Status Code Distribution (Real-time)</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background/95 border p-2 rounded-lg shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">{data.description}</p>
                            <p className="text-sm">Count: {data.value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts (Real-time)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts?.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg bg-muted flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium text-destructive">
                        {log.statusCode}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {log.message}
                      </p>
                    </div>
                    <time className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </time>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}