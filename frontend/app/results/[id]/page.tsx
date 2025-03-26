"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useToast } from "@/components/ui/use-toast";
import { pollsAPI } from "@/lib/api";

type PollResult = {
  _id: string;
  count: number;
};

type Poll = {
  _id: string;
  question: string;
  options: string[];
  expiration: string;
  createdAt: string;
};

const COLORS = [
  "#8884d8",
  "#83a6ed",
  "#8dd1e1",
  "#82ca9d",
  "#a4de6c",
  "#d0ed57",
  "#ffc658",
];

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<PollResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch poll data and results in parallel
        const [pollData, resultsData] = await Promise.all([
          pollsAPI.getPoll(id as string),
          pollsAPI.getResults(id as string),
        ]);

        setPoll(pollData);
        setResults(resultsData);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load poll results"
        );
        toast({
          title: "Error",
          description: "Failed to load poll results",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up polling for real-time updates if using WebSockets
    // For now, we'll just poll every 10 seconds
    const pollInterval = setInterval(() => {
      pollsAPI
        .getResults(id as string)
        .then((newResults) => setResults(newResults))
        .catch((err) => console.error("Error polling results:", err));
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [id, toast]);

  // Transform results into chart-friendly format
  const chartData =
    poll?.options.map((option) => {
      const resultItem = results.find((r) => r._id === option);
      return {
        name: option,
        votes: resultItem ? resultItem.count : 0,
      };
    }) || [];

  // Calculate total votes
  const totalVotes = chartData.reduce((sum, item) => sum + item.votes, 0);

  const renderBarChart = () => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value} votes`, "Votes"]} />
          <Legend />
          <Bar dataKey="votes" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = () => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={150}
            fill="#8884d8"
            dataKey="votes"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} votes`, "Votes"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />

        <Card className="mb-8">
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>
            {error || "Failed to load poll results. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-primary">{poll.question}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Created on {new Date(poll.createdAt).toLocaleDateString()} •
        {new Date() > new Date(poll.expiration)
          ? " Poll closed on "
          : " Poll closes on "}
        {new Date(poll.expiration).toLocaleDateString()}
      </p>

      <div className="text-sm text-muted-foreground mb-8">
        Total responses: <span className="font-semibold">{totalVotes}</span>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>Showing voting results</CardDescription>
        </CardHeader>
        <CardContent>
          {totalVotes === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No votes recorded for this poll yet.
            </div>
          ) : (
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="chart">Bar Chart</TabsTrigger>
                <TabsTrigger value="pie">Pie Chart</TabsTrigger>
              </TabsList>
              <TabsContent value="chart">{renderBarChart()}</TabsContent>
              <TabsContent value="pie">{renderPieChart()}</TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
