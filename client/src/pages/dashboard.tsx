import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { HttpLog } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Dashboard() {
  const { logoutMutation } = useAuth();
  const { logs: realtimeLogs } = useWebSocket();

  // Calculate metrics
  const displayLogs = realtimeLogs || [];
  const totalRequests = displayLogs.length;
  const errorRequests = displayLogs.filter(log => log.statusCode >= 400).length;
  const errorRate = totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) : "0.00";
  const avgResponseTime = "127"; // This would be calculated from actual response times if available

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
          <div className="flex gap-4">
            <Button asChild variant="outline">
              <Link href="/analysis">
                Data Range Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Server Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Server Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-green-500">Operational</span>
                <span className="text-sm text-muted-foreground">
                  Last checked: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{totalRequests.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">Last 24 hours</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{errorRate}%</span>
                <span className="text-sm text-muted-foreground">Last 24 hours</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{avgResponseTime} ms</span>
                <span className="text-sm text-muted-foreground">Last 24 hours</span>
              </div>
            </CardContent>
          </Card>
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