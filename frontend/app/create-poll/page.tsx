"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X, HelpCircle, Copy, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { pollsAPI } from "@/lib/api";
import { PollTypes } from "../../../shared/poll.types.js";

/**
 * MCP: This function handles the creation of a poll and its associated logic.
 * It includes form validation, API calls, and state management.
 * Private Polls are supported with email list or regex restrictions.
 * If the poll(private or Public) is created successfully, it redirects to the "my polls" page and not display the section to copy the Poll Link.
 * For Private Polls : Enter comma-separated email addresses or regex pattern to restrict access.
 * Only users with matching email addresses can access the poll.
 * Private Poll Flow :
 * 1. User creates a poll and selects "Private Poll".
 * 2. User enters a comma-separated list of email addresses or a regex pattern.
 * 3. The poll is created with the specified restrictions.
 * 4. Only users with matching email addresses will be able to see the Poll and Vote in it.
 * 5. By default the Person who created a Private Poll can Vote in it.
 * @returns JSX.Element
 */

export default function CreatePollPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [restriction, setRestriction] = useState("");
  const [restrictionType, setRestrictionType] = useState("email-list"); // "email-list" or "regex"
  const [duration, setDuration] = useState("60"); // Default to 60 minutes (1 hour)
  const [questionType, setQuestionType] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pollCreated, setPollCreated] = useState(false);
  const [pollLink, setPollLink] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect to login if not logged in
    if (!isLoggedIn) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a poll",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [isLoggedIn, router, toast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      newErrors.duration = "Valid duration is required";
    }

    if (questions.length === 0) {
      newErrors.questions = "At least one question is required";
    }

    questions.forEach((question, index) => {
      if (!question.text.trim()) {
        newErrors[`question_${index}`] = "Question text is required";
      }

      if (["single", "multiple", "dropdown"].includes(question.type)) {
        if (!question.options || question.options.length < 2) {
          newErrors[`question_${index}_options`] =
            "At least two options are required";
        } else {
          const emptyOptions = question.options.filter(
            (opt: string) => !opt.trim()
          ).length;
          if (emptyOptions > 0) {
            newErrors[`question_${index}_options`] =
              "All options must have text";
          }
        }
      }
    });

    // Enhanced validation for private poll restrictions
    if (isPrivate) {
      if (!restriction.trim()) {
        newErrors.restriction =
          "Access restriction is required for private polls";
      } else if (restrictionType === "email-list") {
        // Validate email format for comma-separated list
        const emails = restriction.split(",").map((email) => email.trim());
        const invalidEmails = emails.filter((email) => {
          return !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        });

        if (invalidEmails.length > 0) {
          newErrors.restriction = `Invalid email format: ${invalidEmails.join(
            ", "
          )}`;
        }
      } else if (restrictionType === "regex") {
        try {
          // Test if it's a valid regex
          new RegExp(restriction);

          // Optionally, test if it could be a valid email regex
          const testEmail = "test@example.com";
          try {
            new RegExp(restriction).test(testEmail);
          } catch (e) {
            newErrors.restriction =
              "Regex pattern might not work properly for email matching";
          }
        } catch (error) {
          newErrors.restriction = "Invalid regex pattern";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate expiration date based on duration in minutes
      const expirationDate = new Date();
      expirationDate.setMinutes(
        expirationDate.getMinutes() + parseInt(duration)
      );

      // Format questions with proper structure for the API
      const formattedQuestions = questions.map((question) => ({
        text: question.text,
        type: question.type,
        options: question.options,
        minValue: question.type === PollTypes.LINEAR ? question.min : undefined,
        maxValue: question.type === PollTypes.LINEAR ? question.max : undefined,
      }));

      // Prepare data for API
      const pollData = {
        title,
        description,
        questions: formattedQuestions,
        expiration: expirationDate.toISOString(),
        isPublic: !isPrivate,
        invitationRestriction: isPrivate ? restriction : undefined,
      };

      // Call the API to create the poll
      const response = await pollsAPI.createPoll(pollData);

      toast({
        title: "Poll created successfully",
        description: "Your poll is now available for voting",
      });

      // For private polls, redirect to my-polls page immediately
      if (isPrivate) {
        router.push("/my-polls");
        return;
      }

      // For public polls, set poll created state for success page
      setPollCreated(true);
      setPollLink(`${window.location.origin}/poll/${response._id}`);
    } catch (error) {
      toast({
        title: "Failed to create poll",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addQuestion = () => {
    if (!questionType) return;

    const newQuestion = {
      type: questionType,
      text: "",
      options: questionType !== "linear" ? ["", ""] : undefined,
      min: questionType === "linear" ? 1 : undefined,
      max: questionType === "linear" ? 5 : undefined,
    };

    setQuestions([...questions, newQuestion]);
    setQuestionType("");
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push("");
    setQuestions(updatedQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(updatedQuestions);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Poll link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error copying link",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const createNewPoll = () => {
    // Reset form
    setTitle("");
    setDescription("");
    setIsPrivate(false);
    setRestriction("");
    setRestrictionType("email-list");
    setDuration("24");
    setQuestions([]);
    setQuestionType("");
    setImage(null);
    setImagePreview(null);
    setErrors({});
    setPollCreated(false);
    setPollLink("");
    setInviteCode("");
    setCopied(false);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? "s" : ""}`;
      } else {
        return `${hours} hour${
          hours !== 1 ? "s" : ""
        } ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`;
      }
    }
  };

  if (pollCreated) {
    return (
      <div className="max-w-md mx-auto mt-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Poll Created Successfully</CardTitle>
            <CardDescription>Share this link with others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input value={pollLink} readOnly />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>

              {isPrivate && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Private Poll Information:
                  </p>
                  <div className="p-2 bg-muted rounded-md">
                    <p className="text-sm">
                      Only users with email addresses that match your specified
                      criteria can access this poll.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() =>
                    router.push(`/poll/${pollLink.split("/").pop()}`)
                  }
                >
                  View Poll
                </Button>
                <Button variant="outline" onClick={createNewPoll}>
                  Create New Poll
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Create a New Poll
          </CardTitle>
          <CardDescription>
            Fill in the form below to create your poll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Poll Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPrivate"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isPrivate">Private Poll</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Private polls are only accessible to people you invite
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {isPrivate && (
                <div className="space-y-2">
                  <div>
                    <Label>Access Restriction Type</Label>
                    <Select
                      value={restrictionType}
                      onValueChange={setRestrictionType}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select restriction type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email-list">
                          Email List (comma-separated)
                        </SelectItem>
                        <SelectItem value="regex">
                          Email Pattern (regex)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="restriction">
                      {restrictionType === "email-list"
                        ? "Allowed Emails (comma-separated)"
                        : "Email Pattern (regex)"}
                    </Label>
                    <Textarea
                      id="restriction"
                      placeholder={
                        restrictionType === "email-list"
                          ? "e.g., user1@example.com, user2@example.com"
                          : "e.g., ^[a-zA-Z0-9._%+-]+@example\\.com$"
                      }
                      value={restriction}
                      onChange={(e) => setRestriction(e.target.value)}
                      disabled={isSubmitting}
                      className={errors.restriction ? "border-destructive" : ""}
                    />
                    {errors.restriction && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.restriction}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {restrictionType === "email-list"
                        ? "Only users with these emails will be able to access the poll"
                        : "Only users with emails matching this pattern will be able to access the poll"}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="duration">
                  Duration: {formatDuration(parseInt(duration))}
                </Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="1440"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={isSubmitting}
                    className={`w-20 ${
                      errors.duration ? "border-destructive" : ""
                    }`}
                  />
                  <div className="flex-1">
                    <Slider
                      value={[parseInt(duration)]}
                      min={1}
                      max={1440}
                      step={1}
                      onValueChange={(value) =>
                        setDuration(value[0].toString())
                      }
                      disabled={isSubmitting}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>1m</span>
                      <span>1h</span>
                      <span>6h</span>
                      <span>12h</span>
                      <span>24h</span>
                    </div>
                  </div>
                </div>
                {errors.duration && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.duration}
                  </p>
                )}
              </div>

              <div>
                <Label>Questions</Label>
                {questions.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No questions added yet
                  </p>
                )}
                {errors.questions && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.questions}
                  </p>
                )}

                <div className="space-y-4 mt-2">
                  {questions.map((question, qIndex) => (
                    <div
                      key={qIndex}
                      className="border p-4 rounded-md relative"
                    >
                      <button
                        type="button"
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                        onClick={() => removeQuestion(qIndex)}
                        disabled={isSubmitting}
                      >
                        <X className="h-5 w-5" />
                      </button>

                      <div className="space-y-2">
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
                            disabled={isSubmitting}
                            className={
                              errors[`question_${qIndex}`]
                                ? "border-destructive"
                                : ""
                            }
                          />
                          {errors[`question_${qIndex}`] && (
                            <p className="text-destructive text-sm mt-1">
                              {errors[`question_${qIndex}`]}
                            </p>
                          )}
                        </div>

                        {question.type !== "linear" && (
                          <div>
                            <Label>Options</Label>
                            {errors[`question_${qIndex}_options`] && (
                              <p className="text-destructive text-sm">
                                {errors[`question_${qIndex}_options`]}
                              </p>
                            )}
                            <div className="space-y-2 mt-1">
                              {question.options.map(
                                (option: string, oIndex: number) => (
                                  <div
                                    key={oIndex}
                                    className="flex items-center space-x-2"
                                  >
                                    <Input
                                      value={option}
                                      onChange={(e) =>
                                        updateOption(
                                          qIndex,
                                          oIndex,
                                          e.target.value
                                        )
                                      }
                                      placeholder={`Option ${oIndex + 1}`}
                                      disabled={isSubmitting}
                                    />
                                    {question.options.length > 2 && (
                                      <button
                                        type="button"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() =>
                                          removeOption(qIndex, oIndex)
                                        }
                                        disabled={isSubmitting}
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                )
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(qIndex)}
                                disabled={isSubmitting}
                              >
                                Add Option
                              </Button>
                            </div>
                          </div>
                        )}

                        {question.type === "linear" && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4">
                              <div>
                                <Label htmlFor={`min-${qIndex}`}>
                                  Min Value
                                </Label>
                                <Input
                                  id={`min-${qIndex}`}
                                  type="number"
                                  value={question.min}
                                  onChange={(e) =>
                                    updateQuestion(
                                      qIndex,
                                      "min",
                                      e.target.value
                                    )
                                  }
                                  className="w-20"
                                  disabled={isSubmitting}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`max-${qIndex}`}>
                                  Max Value
                                </Label>
                                <Input
                                  id={`max-${qIndex}`}
                                  type="number"
                                  value={question.max}
                                  onChange={(e) =>
                                    updateQuestion(
                                      qIndex,
                                      "max",
                                      e.target.value
                                    )
                                  }
                                  className="w-20"
                                  disabled={isSubmitting}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Label htmlFor="questionType">Add Question</Label>
                  <div className="flex space-x-2 mt-1">
                    <Select
                      value={questionType}
                      onValueChange={setQuestionType}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="questionType">
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
                    <Button
                      type="button"
                      onClick={addQuestion}
                      disabled={!questionType || isSubmitting}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <CardFooter className="px-0 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Poll"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
