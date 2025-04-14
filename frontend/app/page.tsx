"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PollTimer } from "@/components/PollTimer";
import { pollsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Lock } from "lucide-react";

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
    name: string;
    _id: string;
  };
  createdAt: string;
};

export default function HomePage() {
  const [publicPolls, setPublicPolls] = useState<Poll[]>([]);
  const [privatePolls, setPrivatePolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState({ public: true, private: true });
  const { toast } = useToast();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchPublicPolls = async () => {
      try {
        const data = await pollsAPI.getPolls();
        setPublicPolls(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load public polls. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading((prev) => ({ ...prev, public: false }));
      }
    };

    const fetchPrivatePolls = async () => {
      if (!isLoggedIn) {
        setLoading((prev) => ({ ...prev, private: false }));
        return;
      }

      try {
        const data = await pollsAPI.getAvailablePrivatePolls();
        setPrivatePolls(data);
      } catch (error) {
        console.error("Failed to fetch private polls:", error);
        // Only show toast if user is logged in to avoid confusion
        if (isLoggedIn) {
          toast({
            title: "Error",
            description:
              "Failed to load private polls. Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading((prev) => ({ ...prev, private: false }));
      }
    };

    fetchPublicPolls();
    fetchPrivatePolls();
  }, [toast, isLoggedIn]);

  const renderPollCard = (poll: Poll) => {
    const isPollExpired = new Date() > new Date(poll.expiration);

    const pollLink = `/poll/${poll._id}`;

    return (
      <Link href={pollLink} key={poll._id}>
        <Card className="h-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-background to-secondary/10">
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
            {poll.creator && (
              <CardDescription>by {poll.creator.name}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {poll.questions.length} questions · Created{" "}
              {new Date(poll.createdAt).toLocaleDateString()}
            </p>
            <PollTimer endTime={new Date(poll.expiration).getTime()} />
          </CardContent>
          <CardFooter>
            <Badge
              variant={!isPollExpired ? "default" : "secondary"}
              className="text-xs px-2 py-1"
            >
              {!isPollExpired ? "Open" : "Closed"}
            </Badge>
          </CardFooter>
        </Card>
      </Link>
    );
  };

  const hasActivePrivatePolls = privatePolls.length > 0 && isLoggedIn;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Anonymous Polling Made Simple
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Create, share, and participate in polls while maintaining privacy and
          security
        </p>
        <Link href="/create-poll">
          <Button size="lg">Create a Poll</Button>
        </Link>
      </div>

      {isLoggedIn && hasActivePrivatePolls ? (
        <Tabs defaultValue="public" className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="public">Public Polls</TabsTrigger>
            <TabsTrigger value="private">
              Available Private Polls ({privatePolls.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="public">
            <h2 className="text-2xl font-bold mb-6">Public Polls</h2>
            {renderPollsList(publicPolls, loading.public)}
          </TabsContent>

          <TabsContent value="private">
            <h2 className="text-2xl font-bold mb-6">Available Private Polls</h2>
            <div className="mb-4 text-sm text-muted-foreground">
              <p>
                These are private polls you have been invited to participate in.
              </p>
            </div>
            {renderPollsList(privatePolls, loading.private)}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-6">Available Polls</h2>
          {renderPollsList(publicPolls, loading.public)}
        </>
      )}
    </div>
  );

  function renderPollsList(polls: Poll[], isLoading: boolean) {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (polls.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No polls available right now.</p>
          <Link
            href="/create-poll"
            className="text-primary hover:underline mt-2 inline-block"
          >
            Create a new poll
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polls.map(renderPollCard)}
      </div>
    );
  }
}
