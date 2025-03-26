"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PollTimer } from "@/components/PollTimer";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Share2, AlertCircle } from "lucide-react";
import { pollsAPI } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

type Poll = {
  _id: string;
  question: string;
  options: string[];
  type: string;
  expiration: string;
  isPublic: boolean;
  createdAt: string;
  creator?: {
    name: string;
  };
};

export default function PollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user has already voted
    const hasVotedBefore = localStorage.getItem(`voted_${id}`) === "true";
    setHasVoted(hasVotedBefore);

    // Check for invite code in URL
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");
    if (code) {
      setInviteCode(code);
    }

    const fetchPoll = async () => {
      try {
        const data = await pollsAPI.getPoll(
          id as string,
          inviteCode || undefined
        );
        setPoll(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load poll"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [id, inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate answers
    if (selectedOptions.length === 0) {
      toast({
        title: "Incomplete submission",
        description: "Please select at least one option before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get or create voter token
      let voterToken = localStorage.getItem("voter_token");
      if (!voterToken) {
        voterToken = uuidv4();
        localStorage.setItem("voter_token", voterToken);
      }

      // Submit vote
      await pollsAPI.submitVote(id as string, {
        selectedOptions,
        voterToken,
      });

      // Mark as voted in local storage
      localStorage.setItem(`voted_${id}`, "true");
      setHasVoted(true);

      toast({
        title: "Vote submitted",
        description: "Thank you for participating in this poll!",
      });
    } catch (error) {
      toast({
        title: "Submission failed",
        description:
          error instanceof Error ? error.message : "Failed to submit your vote",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionChange = (option: string) => {
    if (poll?.type === "single") {
      setSelectedOptions([option]);
    } else if (poll?.type === "multiple") {
      if (selectedOptions.includes(option)) {
        setSelectedOptions(selectedOptions.filter((item) => item !== option));
      } else {
        setSelectedOptions([...selectedOptions, option]);
      }
    }
  };

  const handleViewResults = () => {
    router.push(`/results/${id}`);
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: poll?.question || "Hush Poll",
          text: "Check out this poll!",
          url,
        });
      } catch (err) {
        setShowShareOptions(true);
      }
    } else {
      setShowShareOptions(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
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
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-3/4"></div>
          <div className="h-4 bg-secondary rounded w-1/2"></div>
          <div className="h-64 bg-secondary rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-secondary rounded"></div>
            <div className="h-4 bg-secondary rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Poll not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isPollExpired = new Date() > new Date(poll.expiration);

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-gradient-to-br from-background to-secondary/10">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary">
                {poll.question}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Created {new Date(poll.createdAt).toLocaleDateString()}
                {poll.creator?.name && ` by ${poll.creator.name}`}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <PollTimer endTime={new Date(poll.expiration).getTime()} />
            <p className="text-sm text-center mt-2">
              {isPollExpired ? "This poll has ended" : "Voting is still open"}
            </p>
          </div>

          {showShareOptions && (
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
              <Input
                value={window.location.href}
                readOnly
                className="flex-1 mr-2"
              />
              <Button onClick={copyToClipboard}>Copy Link</Button>
            </div>
          )}

          {hasVoted ? (
            <Alert>
              <AlertTitle>You've already voted</AlertTitle>
              <AlertDescription>
                You have already submitted your response to this poll.
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={handleViewResults}
                >
                  View results
                </Button>
              </AlertDescription>
            </Alert>
          ) : isPollExpired ? (
            <Alert>
              <AlertTitle>Poll Closed</AlertTitle>
              <AlertDescription>
                This poll is no longer accepting responses.
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={handleViewResults}
                >
                  View results
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 className="text-lg font-semibold mb-4">
                Select your answer:
              </h3>

              {poll.type === "single" && (
                <RadioGroup
                  value={selectedOptions[0] || ""}
                  onValueChange={(value) => setSelectedOptions([value])}
                  className="space-y-2"
                >
                  {poll.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {poll.type === "multiple" && (
                <div className="space-y-2">
                  {poll.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={selectedOptions.includes(option)}
                        onCheckedChange={() => handleOptionChange(option)}
                      />
                      <Label htmlFor={option} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="submit"
                className="mt-6 w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Vote"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Your response is anonymous. This poll{" "}
            {!poll.isPublic && "is private and "}
            will be available until {new Date(poll.expiration).toLocaleString()}
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
