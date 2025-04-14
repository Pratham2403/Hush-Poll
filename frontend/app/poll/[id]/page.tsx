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
import { PollTypes } from "../../../../shared/poll.types.js";

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
  createdAt: string;
  creator?: {
    name: string;
  };
};

export default function PollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Wait for authentication to complete before fetching the poll
    if (authLoading) return;

    // Check if user has already voted
    const hasVotedBefore = localStorage.getItem(`voted_${id}`) === "true";
    setHasVoted(hasVotedBefore);

    const fetchPoll = async () => {
      try {
        const data = await pollsAPI.getPoll(id as string);
        setPoll(data);

        // Initialize responses array with empty values for each question
        if (data.questions) {
          const initialResponses = data.questions.map((question, index) => ({
            questionIdx: index,
            selectedOptions: [],
          }));
          setResponses(initialResponses);
        }
      } catch (error: any) {
        let errorMessage = "Failed to load poll";

        if (error.response) {
          // Handle specific error cases
          if (error.response.status === 401) {
            errorMessage =
              "Authentication required to access this private poll. Please log in to continue.";
          } else if (error.response.status === 403) {
            errorMessage = "You don't have permission to view this poll.";
          } else if (error.response.status === 404) {
            errorMessage = "Poll not found. It may have been deleted.";
          } else if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setError(errorMessage);

        // Show toast notification without logging out
        toast({
          title: "Error loading poll",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [id, toast, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all questions have responses
    const hasEmptyResponses = responses.some(
      (response) => response.selectedOptions.length === 0
    );

    if (hasEmptyResponses) {
      toast({
        title: "Incomplete submission",
        description: "Please answer all questions before submitting",
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
        responses,
        voterToken,
      });

      // Mark as voted in local storage
      localStorage.setItem(`voted_${id}`, "true");
      setHasVoted(true);

      toast({
        title: "Vote submitted",
        description: "Thank you for participating in this poll!",
      });
    } catch (error: any) {
      let errorMessage = "Failed to submit your vote";

      if (error.response) {
        // Handle specific error cases
        if (error.response.status === 401) {
          errorMessage =
            "Authentication required to vote in this poll. Please log in to continue.";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to vote in this poll.";
        } else if (error.response.status === 404) {
          errorMessage = "Poll not found. It may have been deleted.";
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionChange = (
    questionIndex: number,
    option: string,
    pollType: string
  ) => {
    const updatedResponses = [...responses];
    const currentResponse = updatedResponses[questionIndex];

    if (
      pollType === PollTypes.SINGLE ||
      pollType === PollTypes.DROPDOWN ||
      pollType === PollTypes.LINEAR
    ) {
      currentResponse.selectedOptions = [option];
    } else if (pollType === PollTypes.MULTIPLE) {
      if (currentResponse.selectedOptions.includes(option)) {
        currentResponse.selectedOptions =
          currentResponse.selectedOptions.filter(
            (item: string) => item !== option
          );
      } else {
        currentResponse.selectedOptions = [
          ...currentResponse.selectedOptions,
          option,
        ];
      }
    }

    setResponses(updatedResponses);
  };

  const handleViewResults = () => {
    router.push(`/results/${id}`);
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: poll?.title || "Hush Poll",
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

  // Render a question based on its type
  const renderQuestion = (question: any, index: number) => {
    // Get current response for this question
    const response = responses[index] || { selectedOptions: [] };

    switch (question.type) {
      case PollTypes.SINGLE:
        return (
          <RadioGroup
            value={response.selectedOptions[0] || ""}
            onValueChange={(value) =>
              handleOptionChange(index, value, question.type)
            }
            className="space-y-2"
          >
            {question.options.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${index}-${option}`} />
                <Label
                  htmlFor={`${index}-${option}`}
                  className="cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case PollTypes.MULTIPLE:
        return (
          <div className="space-y-2">
            {question.options.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${index}-${option}`}
                  checked={response.selectedOptions.includes(option)}
                  onCheckedChange={() =>
                    handleOptionChange(index, option, question.type)
                  }
                />
                <Label
                  htmlFor={`${index}-${option}`}
                  className="cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case PollTypes.DROPDOWN:
        return (
          <div className="space-y-2">
            <Select
              value={response.selectedOptions[0] || ""}
              onValueChange={(value) =>
                handleOptionChange(index, value, question.type)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {question.options.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case PollTypes.LINEAR:
        return (
          <div className="space-y-6">
            <div className="pt-6">
              <Slider
                value={
                  response.selectedOptions.length
                    ? [parseInt(response.selectedOptions[0])]
                    : [
                        parseInt(
                          question.options[0] || question.minValue || "1"
                        ),
                      ]
                }
                min={question.minValue || 1}
                max={question.maxValue || 5}
                step={1}
                onValueChange={(values) =>
                  handleOptionChange(index, values[0].toString(), question.type)
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                {question.options.map((option: string) => (
                  <span key={option}>{option}</span>
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">
                Selected:{" "}
                {response.selectedOptions[0] ||
                  question.options[0] ||
                  question.minValue ||
                  "1"}
              </p>
            </div>
          </div>
        );

      default:
        return <p>Unsupported question type</p>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-gradient-to-br from-background to-secondary/10">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary">
                {poll.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Created {new Date(poll.createdAt).toLocaleDateString()}
                {poll.creator?.name && ` by ${poll.creator.name}`}
              </p>
              {poll.description && (
                <p className="mt-4 text-muted-foreground">{poll.description}</p>
              )}
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
              <div className="space-y-8">
                {poll.questions &&
                  poll.questions.map((question, index) => (
                    <div key={index} className="border-b pb-6 last:border-0">
                      <h3 className="text-lg font-semibold mb-4">
                        {index + 1}. {question.text}
                      </h3>
                      {renderQuestion(question, index)}
                    </div>
                  ))}
              </div>

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
