"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PollTimer } from "@/components/PollTimer";
import { pollsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

type Poll = {
  _id: string;
  question: string;
  options: string[];
  expiration: string;
  createdAt: string;
  creator?: {
    name: string;
  };
};

export default function HomePage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">
        Available Polls
      </h1>

      {loading ? (
        <div className="flex justify-center">
          <p>Loading polls...</p>
        </div>
      ) : polls.length === 0 ? (
        <div className="text-center">
          <p className="text-muted-foreground">No polls available right now.</p>
          <Link
            href="/create-poll"
            className="text-primary hover:underline mt-2 inline-block"
          >
            Create a new poll
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <Link href={`/poll/${poll._id}`} key={poll._id}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-background to-secondary/10">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-primary">
                    {poll.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {poll.options.length} options · Created{" "}
                    {new Date(poll.createdAt).toLocaleDateString()}
                  </p>
                  <PollTimer endTime={new Date(poll.expiration).getTime()} />
                </CardContent>
                <CardFooter>
                  <Badge
                    variant={
                      new Date() < new Date(poll.expiration)
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs px-2 py-1"
                  >
                    {new Date() < new Date(poll.expiration) ? "Open" : "Closed"}
                  </Badge>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
