"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { X, AlertCircle, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { pollsAPI } from "@/lib/api";
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
};

export default function EditPollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { isAdmin, isLoggedIn } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication required",
        description: "Please log in to edit polls",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    const fetchPoll = async () => {
      try {
        const data = await pollsAPI.getPoll(id);
        setPoll({
          ...data,
          // Add a default description if not present
          description: data.description || "",
        });
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load poll"
        );
        toast({
          title: "Error",
          description: "Failed to load poll data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [isLoggedIn, isAdmin, router, id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!poll) return;

    setIsSubmitting(true);

    try {
      // Prepare updated poll data
      const updatedPollData = {
        title: poll.title,
        description: poll.description,
        questions: poll.questions,
        isPublic: poll.isPublic,
      };

      // Call API to update poll
      await pollsAPI.updatePoll(id, updatedPollData);

      toast({
        title: "Poll updated",
        description: "The poll has been successfully updated",
      });

      router.push("/manage-polls");
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Failed to update poll",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateQuestion = (questionIndex: number, field: string, value: any) => {
    if (poll) {
      const updatedQuestions = [...poll.questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        [field]: value,
      };
      setPoll({ ...poll, questions: updatedQuestions });
    }
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    if (poll) {
      const updatedQuestions = [...poll.questions];
      const updatedOptions = [...updatedQuestions[questionIndex].options];
      updatedOptions[optionIndex] = value;
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        options: updatedOptions,
      };
      setPoll({ ...poll, questions: updatedQuestions });
    }
  };

  const addOption = (questionIndex: number) => {
    if (poll) {
      const updatedQuestions = [...poll.questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        options: [...updatedQuestions[questionIndex].options, ""],
      };
      setPoll({ ...poll, questions: updatedQuestions });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (poll && poll.questions[questionIndex].options.length > 2) {
      const updatedQuestions = [...poll.questions];
      const updatedOptions = updatedQuestions[questionIndex].options.filter(
        (_, index) => index !== optionIndex
      );
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        options: updatedOptions,
      };
      setPoll({ ...poll, questions: updatedQuestions });
    } else {
      toast({
        title: "Cannot remove option",
        description: "A question must have at least two options",
        variant: "destructive",
      });
    }
  };

  const addQuestion = () => {
    if (poll) {
      setPoll({
        ...poll,
        questions: [
          ...poll.questions,
          {
            text: "",
            type: PollTypes.SINGLE,
            options: ["", ""],
          },
        ],
      });
    }
  };

  const removeQuestion = (questionIndex: number) => {
    if (poll && poll.questions.length > 1) {
      const updatedQuestions = poll.questions.filter(
        (_, index) => index !== questionIndex
      );
      setPoll({ ...poll, questions: updatedQuestions });
    } else {
      toast({
        title: "Cannot remove question",
        description: "A poll must have at least one question",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!poll) {
    return <div className="max-w-3xl mx-auto py-8">Poll not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Edit Poll</CardTitle>
          <CardDescription>
            Make changes to your poll and save when done
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title</Label>
              <Input
                id="title"
                value={poll.title}
                onChange={(e) => setPoll({ ...poll, title: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={poll.description}
                onChange={(e) =>
                  setPoll({ ...poll, description: e.target.value })
                }
                disabled={isSubmitting}
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Questions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Question
                </Button>
              </div>

              {poll.questions.map((question, qIndex) => (
                <Card key={qIndex} className="p-4 border">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium">
                      Question {qIndex + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                      disabled={isSubmitting || poll.questions.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`question-${qIndex}`}>
                        Question Text
                      </Label>
                      <Input
                        id={`question-${qIndex}`}
                        value={question.text}
                        onChange={(e) =>
                          updateQuestion(qIndex, "text", e.target.value)
                        }
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`type-${qIndex}`}>Question Type</Label>
                      <Select
                        value={question.type}
                        onValueChange={(value) =>
                          updateQuestion(qIndex, "type", value)
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id={`type-${qIndex}`}>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PollTypes.SINGLE}>
                            Single Choice
                          </SelectItem>
                          <SelectItem value={PollTypes.MULTIPLE}>
                            Multiple Choice
                          </SelectItem>
                          <SelectItem value={PollTypes.LINEAR}>
                            Linear Scale
                          </SelectItem>
                          <SelectItem value={PollTypes.DROPDOWN}>
                            Dropdown
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {question.type === PollTypes.LINEAR ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-1/2">
                            <Label htmlFor={`min-${qIndex}`}>Min Value</Label>
                            <Input
                              id={`min-${qIndex}`}
                              type="number"
                              value={question.minValue || 1}
                              onChange={(e) =>
                                updateQuestion(
                                  qIndex,
                                  "minValue",
                                  parseInt(e.target.value)
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="w-1/2">
                            <Label htmlFor={`max-${qIndex}`}>Max Value</Label>
                            <Input
                              id={`max-${qIndex}`}
                              type="number"
                              value={question.maxValue || 5}
                              onChange={(e) =>
                                updateQuestion(
                                  qIndex,
                                  "maxValue",
                                  parseInt(e.target.value)
                                )
                              }
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Preview</Label>
                          <div className="pt-4 px-2">
                            <Slider
                              value={[
                                (question.minValue || 1) +
                                  Math.floor(
                                    (question.maxValue || 5) -
                                      (question.minValue || 1)
                                  ) /
                                    2,
                              ]}
                              min={question.minValue || 1}
                              max={question.maxValue || 5}
                              step={1}
                              disabled={true}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>{question.minValue || 1}</span>
                              <span>{question.maxValue || 5}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center">
                          <Label>Options</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(qIndex)}
                            disabled={isSubmitting}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Option
                          </Button>
                        </div>
                        <div className="space-y-2 mt-2">
                          {question.options.map((option, oIndex) => (
                            <div
                              key={oIndex}
                              className="flex items-center space-x-2"
                            >
                              <Input
                                value={option}
                                onChange={(e) =>
                                  updateOption(qIndex, oIndex, e.target.value)
                                }
                                placeholder={`Option ${oIndex + 1}`}
                                disabled={isSubmitting}
                              />
                              {question.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                  disabled={isSubmitting}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <CardFooter className="flex justify-end space-x-2 p-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/manage-polls")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
