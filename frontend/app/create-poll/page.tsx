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

export default function CreatePollPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [restriction, setRestriction] = useState("");
  const [duration, setDuration] = useState("24");
  const [questionType, setQuestionType] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pollCreated, setPollCreated] = useState(false);
  const [pollLink, setPollLink] = useState("");
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
      // Calculate expiration date based on duration
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + parseInt(duration));

      // Prepare data for API
      const pollData = {
        question: title,
        options: questions[0].options, // For now, we're supporting one question with multiple options
        type: "single", // Default to single choice
        expiration: expirationDate.toISOString(),
        isPublic: !isPrivate,
      };

      // If the poll is private, add invitation code logic
      if (isPrivate && restriction) {
        pollData.invitationRestriction = restriction;
      }

      // Call the API to create the poll
      const response = await pollsAPI.createPoll(pollData);

      setPollCreated(true);
      setPollLink(`${window.location.origin}/poll/${response._id}`);

      toast({
        title: "Poll created successfully",
        description: "Your poll is now available for voting",
      });
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
      minLabel: questionType === "linear" ? "" : undefined,
      maxLabel: questionType === "linear" ? "" : undefined,
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
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[
      questionIndex
    ].options.filter((_, i) => i !== optionIndex);
    setQuestions(updatedQuestions);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const createNewPoll = () => {
    setPollCreated(false);
    setTitle("");
    setDescription("");
    setIsPrivate(false);
    setRestriction("");
    setDuration("24");
    setQuestions([]);
    setImage(null);
    setImagePreview(null);
    setErrors({});
  };

  if (pollCreated) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="bg-gradient-to-br from-background to-secondary/10">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">
              Poll Created Successfully!
            </CardTitle>
            <CardDescription>
              Share your poll with others using the link below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Input value={pollLink} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={createNewPoll}>
                Create Another Poll
              </Button>
              <Button onClick={() => router.push(pollLink)}>View Poll</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-gradient-to-br from-background to-secondary/10">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            Create a New Poll
          </CardTitle>
          <CardDescription>
            Fill out the form below to create your anonymous poll
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-lg font-medium text-foreground"
              >
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter poll title"
                className="text-lg"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "title-error" : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-destructive mt-1">
                  {errors.title}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-lg font-medium text-foreground"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your poll"
                className="text-lg"
                rows={4}
                aria-invalid={!!errors.description}
                aria-describedby={
                  errors.description ? "description-error" : undefined
                }
              />
              {errors.description && (
                <p
                  id="description-error"
                  className="text-sm text-destructive mt-1"
                >
                  {errors.description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="image"
                className="text-lg font-medium text-foreground"
              >
                Poll Image (Optional)
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Maximum file size: 5MB. Recommended dimensions: 1200x630px.
              </p>
              {imagePreview && (
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Poll preview"
                  className="mt-2 max-w-full h-auto rounded-md"
                />
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="questionType"
                  className="text-lg font-medium text-foreground"
                >
                  Question Type
                </Label>
                <Select onValueChange={setQuestionType} value={questionType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Choice</SelectItem>
                    <SelectItem value="multiple">Multiple Choice</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                    <SelectItem value="linear">Linear Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={addQuestion}
                disabled={!questionType}
                className="w-full"
              >
                Add Question
              </Button>
              {errors.questions && (
                <p className="text-sm text-destructive mt-1">
                  {errors.questions}
                </p>
              )}
            </div>
            {questions.map((question, index) => (
              <Card key={index} className="mt-4 bg-background relative">
                <CardContent className="pt-8 pb-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    onClick={() => removeQuestion(index)}
                    aria-label="Remove question"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Input
                    value={question.text}
                    onChange={(e) =>
                      updateQuestion(index, "text", e.target.value)
                    }
                    placeholder="Enter question text"
                    className="mb-4 text-lg"
                    aria-invalid={!!errors[`question_${index}`]}
                    aria-describedby={
                      errors[`question_${index}`]
                        ? `question-${index}-error`
                        : undefined
                    }
                  />
                  {errors[`question_${index}`] && (
                    <p
                      id={`question-${index}-error`}
                      className="text-sm text-destructive mb-2"
                    >
                      {errors[`question_${index}`]}
                    </p>
                  )}
                  {["single", "multiple", "dropdown"].includes(
                    question.type
                  ) && (
                    <>
                      {question.options?.map(
                        (option: string, optionIndex: number) => (
                          <div
                            key={optionIndex}
                            className="flex items-center mt-2"
                          >
                            <Input
                              value={option}
                              onChange={(e) =>
                                updateOption(index, optionIndex, e.target.value)
                              }
                              placeholder={`Option ${optionIndex + 1}`}
                              className="flex-grow text-lg"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(index, optionIndex)}
                              className="ml-2 text-muted-foreground hover:text-destructive"
                              aria-label={`Remove option ${optionIndex + 1}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                      {errors[`question_${index}_options`] && (
                        <p className="text-sm text-destructive mt-2">
                          {errors[`question_${index}_options`]}
                        </p>
                      )}
                      <Button
                        type="button"
                        onClick={() => addOption(index)}
                        className="mt-2"
                      >
                        Add Option
                      </Button>
                    </>
                  )}
                  {question.type === "linear" && (
                    <div className="mt-4 space-y-4">
                      <div className="flex justify-between gap-4">
                        <div className="w-full">
                          <Label
                            htmlFor={`minLabel-${index}`}
                            className="text-sm font-medium text-muted-foreground"
                          >
                            Minimum Label
                          </Label>
                          <Input
                            id={`minLabel-${index}`}
                            value={question.minLabel || ""}
                            onChange={(e) =>
                              updateQuestion(index, "minLabel", e.target.value)
                            }
                            placeholder="e.g., Not satisfied"
                            className="mt-1"
                          />
                        </div>
                        <div className="w-full">
                          <Label
                            htmlFor={`maxLabel-${index}`}
                            className="text-sm font-medium text-muted-foreground"
                          >
                            Maximum Label
                          </Label>
                          <Input
                            id={`maxLabel-${index}`}
                            value={question.maxLabel || ""}
                            onChange={(e) =>
                              updateQuestion(index, "maxLabel", e.target.value)
                            }
                            placeholder="e.g., Very satisfied"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Input
                          type="number"
                          value={question.min || 1}
                          onChange={(e) =>
                            updateQuestion(index, "min", e.target.value)
                          }
                          placeholder="Min"
                          className="w-20"
                        />
                        <Slider
                          min={Number(question.min) || 1}
                          max={Number(question.max) || 5}
                          step={1}
                          className="flex-grow"
                        />
                        <Input
                          type="number"
                          value={question.max || 5}
                          onChange={(e) =>
                            updateQuestion(index, "max", e.target.value)
                          }
                          placeholder="Max"
                          className="w-20"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label
                htmlFor="private"
                className="text-lg font-medium text-foreground"
              >
                Private Poll
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Private polls require a specific email pattern to access.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isPrivate && (
              <div className="space-y-2">
                <Label
                  htmlFor="restriction"
                  className="text-lg font-medium text-foreground"
                >
                  Restriction Regex
                </Label>
                <Input
                  id="restriction"
                  value={restriction}
                  onChange={(e) => setRestriction(e.target.value)}
                  placeholder="e.g. ^[a-zA-Z0-9._%+-]+@company\.com$"
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Enter a regex pattern to restrict access to this poll. For
                  example, use the pattern above to restrict to company email
                  addresses.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label
                htmlFor="duration"
                className="text-lg font-medium text-foreground"
              >
                Duration (in hours)
              </Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                placeholder="Enter poll duration"
                className="text-lg"
                aria-invalid={!!errors.duration}
                aria-describedby={
                  errors.duration ? "duration-error" : undefined
                }
              />
              {errors.duration && (
                <p
                  id="duration-error"
                  className="text-sm text-destructive mt-1"
                >
                  {errors.duration}
                </p>
              )}
            </div>
            <CardFooter className="flex justify-end px-0">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Poll"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
