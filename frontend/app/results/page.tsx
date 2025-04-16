"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pollsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

type Poll = {
  _id: string;
  title: string;
  options: string[];
  expiration: string;
  createdAt: string;
};

export default function ResultsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const data = await pollsAPI.getPolls();
        
        setPolls(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load polls. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, [toast]);
  
  const isPollActive = (expirationDate: string) => {
    return new Date(expirationDate) > new Date();
  };

  const viewPollResults = (pollId: string) => {
    router.push(`/results/${pollId}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Poll Results</h1>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No polls available</p>
          <Button onClick={() => router.push("/create-poll")} className="mt-4">
            Create a Poll
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <Card key={poll._id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{poll.title}</CardTitle>
                  <Badge
                    variant={
                      isPollActive(poll.expiration) ? "default" : "secondary"
                    }
                  >
                    {isPollActive(poll.expiration) ? "Active" : "Closed"}
                  </Badge>
                </div>
                <CardDescription>
                  Created on {new Date(poll.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => viewPollResults(poll._id)}>
                  View Results
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
