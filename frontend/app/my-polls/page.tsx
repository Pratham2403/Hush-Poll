"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { PollTimer } from "@/components/PollTimer";
import { Copy, ExternalLink, BarChart2, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { pollsAPI } from "@/lib/api";

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
  isPublic: boolean;
  inviteCodes?: string[];
  creator?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  votes?: number;
};

export default function MyPollsPage() {
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [closedPolls, setClosedPolls] = useState<Poll[]>([]);
  const [availablePrivatePolls, setAvailablePrivatePolls] = useState<Poll[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication required",
        description: "Please log in to view your polls",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    const fetchPolls = async () => {
      try {
        setIsLoading(true);

        // Fetch user's polls
        const userPolls = await pollsAPI.getUserPolls();

        // Separate active and closed polls
        const now = new Date();
        const active = userPolls.filter(
          (poll: Poll) => new Date(poll.expiration) > now
        );
        const closed = userPolls.filter(
          (poll: Poll) => new Date(poll.expiration) <= now
        );

        setActivePolls(active);
        setClosedPolls(closed);

        // Fetch available private polls
        const privatePolls = await pollsAPI.getAvailablePrivatePolls();

        // Filter out polls the user created (they're already in active/closed)
        const filtered = privatePolls.filter(
          (poll: Poll) => !poll.creator || poll.creator._id !== user?._id
        );

        setAvailablePrivatePolls(filtered);
      } catch (error) {
        console.error(error);
        toast({
          title: "Failed to load polls",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolls();
  }, [isLoggedIn, router, toast, user?._id]);

  const copyPollLink = async (id: string) => {
    let link = `${window.location.origin}/poll/${id}`;

    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copied",
        description: "Poll link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading your polls...</p>
        </div>
      </div>
    );
  }

  const renderPollCard = (poll: Poll, isPrivatePoll: boolean = false) => {
    const now = new Date();
    const expiration = new Date(poll.expiration);
    const isExpired = expiration <= now;

    return (
      <Card
        key={poll._id}
        className={`h-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br ${
          isExpired
            ? "from-background to-secondary/5"
            : "from-background to-secondary/10"
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-primary">
              {poll.title}
            </CardTitle>
            {!poll.isPublic && (
              <Badge variant="outline" className="ml-2">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
          {isPrivatePoll && poll.creator && (
            <CardDescription>Created by: {poll.creator.name}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col ">
          <div className="mb-2 flex-grow">
            <p className="text-sm text-muted-foreground">
              {poll.questions.length} questions
            </p>
          </div>
          <div className="mt-auto space-y-2">
            {!isExpired ? (
              <PollTimer endTime={new Date(poll.expiration).getTime()} />
            ) : (
              <div className="text-sm text-muted-foreground">Poll Ended</div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyPollLink(poll._id)}
                  aria-label="Copy poll link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="View poll"
                >
                  <Link href={`/poll/${poll._id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="View results"
                >
                  <Link href={`/results/${poll._id}`}>
                    <BarChart2 className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">My Polls</h1>
        <Button onClick={() => router.push("/create-poll")}>
          Create New Poll
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="active">
            My Active Polls ({activePolls.length})
          </TabsTrigger>
          <TabsTrigger value="closed">
            My Closed Polls ({closedPolls.length})
          </TabsTrigger>
          <TabsTrigger value="private">
            Available Private Polls ({availablePrivatePolls.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activePolls.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CardDescription className="text-center mb-4">
                  You don't have any active polls yet.
                </CardDescription>
                <Button onClick={() => router.push("/create-poll")}>
                  Create Your First Poll
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePolls.map((poll) => renderPollCard(poll))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed">
          {closedPolls.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CardDescription className="text-center">
                  You don't have any closed polls yet.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {closedPolls.map((poll) => renderPollCard(poll))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="private">
          {availablePrivatePolls.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CardDescription className="text-center">
                  No private polls are available for you at the moment.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePrivatePolls.map((poll) => renderPollCard(poll, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
