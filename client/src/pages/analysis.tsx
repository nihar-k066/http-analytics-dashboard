import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { HttpLog } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Analysis() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const { data: logs } = useQuery<HttpLog[]>({
    queryKey: ["/api/logs", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/logs?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  const displayLogs = logs || [];
  
  // Calculate metrics
  const totalRequests = displayLogs.length;
  const errorRequests = displayLogs.filter(log => log.statusCode >= 400).length;
  const errorRate = totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) : "0.00";
  const avgResponseTime = "106"; // This would be calculated from actual response times

  // Group by status code category
  const statusGroups = displayLogs.reduce((acc, log) => {
    const category = Math.floor(log.statusCode / 100);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Calculate total 5xx errors
  const total5xxErrors = statusGroups[5] || 0;

  // Group by date for daily breakdown
  const dailyBreakdown = displayLogs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        total: 0,
        '2xx': 0,
        '3xx': 0,
        '4xx': 0,
        '5xx': 0,
      };
    }
    acc[date].total++;
    const category = `${Math.floor(log.statusCode / 100)}xx`;
    acc[date][category as keyof typeof acc[typeof date]]++;
    return acc;
  }, {} as Record<string, { total: number; '2xx': number; '3xx': number; '4xx': number; '5xx': number; }>);

  // Prepare data for pie chart
  const chartData = [
    { name: '5xx Errors', value: statusGroups[5] || 0, color: '#FF8042' },
    { name: '4xx Errors', value: statusGroups[4] || 0, color: '#FFBB28' },
    { name: 'Other', value: (statusGroups[2] || 0) + (statusGroups[3] || 0), color: '#00C49F' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="outline" className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Data Range Analysis</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {totalRequests.toLocaleString()}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{errorRate}%</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{avgResponseTime} ms</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total 5xx Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{total5xxErrors.toLocaleString()}</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>HTTP Status Breakdown</CardTitle>
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
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-right py-2">2xx</th>
                      <th className="text-right py-2">3xx</th>
                      <th className="text-right py-2">4xx</th>
                      <th className="text-right py-2">5xx</th>
                      <th className="text-right py-2">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(dailyBreakdown)
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .map(([date, stats]) => {
                        const errorRate = ((stats['4xx'] + stats['5xx']) / stats.total * 100).toFixed(2);
                        return (
                          <tr key={date} className="border-t">
                            <td className="py-2">{date}</td>
                            <td className="text-right">{stats.total.toLocaleString()}</td>
                            <td className="text-right">{stats['2xx'].toLocaleString()}</td>
                            <td className="text-right">{stats['3xx'].toLocaleString()}</td>
                            <td className="text-right">{stats['4xx'].toLocaleString()}</td>
                            <td className="text-right">{stats['5xx'].toLocaleString()}</td>
                            <td className="text-right">{errorRate}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
