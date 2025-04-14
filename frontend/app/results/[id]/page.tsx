"use client";

import { useState, useEffect, useRef } from "react";
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
import { useAuth } from "@/lib/auth-context";
import { PollTypes } from "../../../../shared/poll.types.js";
import { AlertCircle } from "lucide-react";
import io from "socket.io-client";
import { isEqual } from "lodash";

// Helper function to deep compare arrays
const areResultsEqual = (oldResults: any[], newResults: any[]) => {
  return isEqual(oldResults, newResults);
};

type QuestionResult = {
  questionIdx: number;
  questionText: string;
  questionType: string;
  options: {
    option: string;
    count: number;
  }[];
  totalVotes: number;
  minValue?: number;
  maxValue?: number;
};

type Poll = {
  _id: string;
  title: string;
  description?: string;
  questions: {
    text: string;
    type: string;
    options: string[];
    minValue?: number;
    maxValue?: number;
  }[];
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
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { isLoading: authLoading } = useAuth();
  const socketRef = useRef<any>(null);
  const resultsRef = useRef<QuestionResult[]>([]);

  // Keep the ref in sync with state
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    // Wait for authentication to complete before fetching the poll
    if (authLoading) return;

    const fetchData = async () => {
      try {
        // Fetch poll data and results in parallel
        const [pollData, resultsData] = await Promise.all([
          pollsAPI.getPoll(id as string),
          pollsAPI.getResults(id as string),
        ]);

        setPoll(pollData);
        setResults(resultsData);

        // Initialize socket connection after successful data fetch
        initializeSocketConnection(pollData._id);
      } catch (error: any) {
        let errorMessage = "Failed to load poll results";

        if (error.response) {
          // Handle specific error cases
          if (error.response.status === 401) {
            errorMessage =
              "Authentication required to access this poll's results. Please log in to continue.";
          } else if (error.response.status === 403) {
            errorMessage =
              "You don't have permission to view this poll's results.";
          } else if (error.response.status === 404) {
            errorMessage = "Poll not found. It may have been deleted.";
          } else if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setError(errorMessage);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Clean up socket connection on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id, toast, authLoading]);

  const initializeSocketConnection = (pollId: string) => {
    // Connect to Socket.IO server
    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    socketRef.current = io(socketUrl);

    // Join the poll room to listen for updates
    socketRef.current.emit("joinPoll", pollId);

    // Listen for vote updates
    socketRef.current.on("voteUpdate", (updatedResults: any) => {
      // Check if we need to update the state based on new data
      if (!areResultsEqual(resultsRef.current, updatedResults)) {
        setIsUpdating(true);

        // Fetch the latest results to ensure complete data
        pollsAPI
          .getResults(id as string)
          .then((newResults) => {
            if (!areResultsEqual(resultsRef.current, newResults)) {
              setResults(newResults);
            }
          })
          .catch((err) => {
            console.error("Error fetching updated results:", err);
          })
          .finally(() => {
            setIsUpdating(false);
          });
      }
    });

    // Handle socket errors
    socketRef.current.on("error", (error: any) => {
      console.error("Socket error:", error);
    });

    // Handle socket disconnection
    socketRef.current.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason);

      // Attempt to reconnect if not intentional
      if (reason === "io server disconnect") {
        socketRef.current.connect();
      }
    });
  };

  // Rendering logic based on poll type
  const renderChartByType = (questionResult: QuestionResult) => {
    if (!questionResult) return null;

    // Transform results into chart-friendly format for the specific question
    const chartData = questionResult.options.map((item) => ({
      name: item.option,
      votes: item.count,
    }));

    // Sort data by votes for better visualization
    const sortedData = [...chartData].sort((a, b) => b.votes - a.votes);

    switch (questionResult.questionType) {
      case PollTypes.LINEAR:
        return renderLinearScaleChart(questionResult, sortedData);
      case PollTypes.DROPDOWN:
      case PollTypes.SINGLE:
      case PollTypes.MULTIPLE:
      default:
        return renderBarChart(sortedData);
    }
  };

  const renderBarChart = (data: any[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          No votes recorded for this question yet.
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
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

  const renderPieChart = (data: any[]) => {
    // Filter out options with zero votes
    const nonZeroData = data.filter((item) => item.votes > 0);

    // If all options have zero votes, show a message
    if (nonZeroData.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          No votes recorded for this question yet.
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={nonZeroData}
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
            {nonZeroData.map((entry, index) => (
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

  const renderLinearScaleChart = (
    questionResult: QuestionResult,
    chartData: any[]
  ) => {
    const { minValue, maxValue, totalVotes } = questionResult;

    if (totalVotes === 0) {
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          No votes recorded for this question yet.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">Distribution on Scale</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} votes`, "Responses"]} />
              <Bar dataKey="votes" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="font-medium mb-2">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/20">
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-xl font-bold">
                {totalVotes > 0
                  ? (
                      chartData.reduce(
                        (sum, item) => sum + parseInt(item.name) * item.votes,
                        0
                      ) / totalVotes
                    ).toFixed(1)
                  : "N/A"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/20">
              <p className="text-sm text-muted-foreground">Most Common</p>
              <p className="text-xl font-bold">
                {
                  chartData.reduce(
                    (prev, current) =>
                      prev.votes > current.votes ? prev : current,
                    { name: "N/A", votes: 0 }
                  ).name
                }
              </p>
            </div>
          </div>
        </div>
      </div>
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
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Failed to load poll results. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-primary">{poll.title}</h1>
      {poll.description && (
        <p className="text-muted-foreground mb-6">{poll.description}</p>
      )}
      <p className="text-sm text-muted-foreground mb-6">
        Created on {new Date(poll.createdAt).toLocaleDateString()} •
        {new Date() > new Date(poll.expiration)
          ? " Poll closed on "
          : " Poll closes on "}
        {new Date(poll.expiration).toLocaleDateString()}
      </p>

      {isUpdating && (
        <div className="mb-2 text-xs text-primary animate-pulse">
          Updating results...
        </div>
      )}

      {results.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              No votes have been recorded yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {results.length > 1 && (
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">Questions</h2>
              <div className="flex flex-wrap gap-2">
                {results.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      activeQuestionIdx === idx
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    Question {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results[activeQuestionIdx] && (
            <Card className="mb-8 transition-all duration-300">
              <CardHeader>
                <CardTitle>{results[activeQuestionIdx].questionText}</CardTitle>
                <CardDescription>
                  Total responses:{" "}
                  <span className="font-semibold">
                    {results[activeQuestionIdx].totalVotes}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results[activeQuestionIdx].totalVotes === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No votes recorded for this question yet.
                  </div>
                ) : (
                  <Tabs defaultValue="chart" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="chart">Bar Chart</TabsTrigger>
                      <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                    </TabsList>
                    <TabsContent
                      value="chart"
                      className="transition-all duration-300"
                    >
                      {renderChartByType(results[activeQuestionIdx])}
                    </TabsContent>
                    <TabsContent
                      value="pie"
                      className="transition-all duration-300"
                    >
                      {renderPieChart(
                        results[activeQuestionIdx].options.map((item) => ({
                          name: item.option,
                          votes: item.count,
                        }))
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
