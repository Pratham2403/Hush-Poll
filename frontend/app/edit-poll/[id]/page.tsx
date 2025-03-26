"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

type Question = {
  type: string
  text: string
  options?: string[]
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
}

type Poll = {
  id: string
  title: string
  description: string
  questions: Question[]
}

export default function EditPollPage({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const router = useRouter()
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAdmin) {
      router.push("/")
    } else {
      // TODO: Fetch actual poll data from the backend
      setPoll({
        id: params.id,
        title: "Sample Poll",
        description: "This is a sample poll description",
        questions: [
          {
            type: "single",
            text: "What's your favorite color?",
            options: ["Red", "Blue", "Green"],
          },
        ],
      })
    }
  }, [isAdmin, router, params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual poll update logic here
    console.log("Updating poll:", poll)
    toast({
      title: "Poll updated",
      description: "The poll has been successfully updated and reset.",
    })
    router.push("/manage-polls")
  }

  const updateQuestion = (index: number, field: string, value: string | string[]) => {
    if (poll) {
      const updatedQuestions = [...poll.questions]
      updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
      setPoll({ ...poll, questions: updatedQuestions })
    }
  }

  const addOption = (questionIndex: number) => {
    if (poll) {
      const updatedQuestions = [...poll.questions]
      updatedQuestions[questionIndex].options = [...(updatedQuestions[questionIndex].options || []), ""]
      setPoll({ ...poll, questions: updatedQuestions })
    }
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    if (poll) {
      const updatedQuestions = [...poll.questions]
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options?.map((option, index) =>
        index === optionIndex ? value : option,
      )
      setPoll({ ...poll, questions: updatedQuestions })
    }
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (poll) {
      const updatedQuestions = [...poll.questions]
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options?.filter(
        (_, index) => index !== optionIndex,
      )
      setPoll({ ...poll, questions: updatedQuestions })
    }
  }

  if (!poll) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="bg-gradient-to-br from-background to-secondary/10">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Edit Poll</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-lg font-medium text-foreground">
                Title
              </Label>
              <Input
                id="title"
                value={poll.title}
                onChange={(e) => setPoll({ ...poll, title: e.target.value })}
                required
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-lg font-medium text-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                value={poll.description}
                onChange={(e) => setPoll({ ...poll, description: e.target.value })}
                required
                className="text-lg"
                rows={4}
              />
            </div>
            {poll.questions.map((question, index) => (
              <Card key={index} className="mt-4 bg-background relative">
                <CardContent className="pt-8 pb-4">
                  <Input
                    value={question.text}
                    onChange={(e) => updateQuestion(index, "text", e.target.value)}
                    placeholder="Enter question text"
                    className="mb-4 text-lg"
                  />
                  <Select value={question.type} onValueChange={(value) => updateQuestion(index, "type", value)}>
                    <SelectTrigger className="w-[200px] mb-4">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Choice</SelectItem>
                      <SelectItem value="multiple">Multiple Choice</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="linear">Linear Scale</SelectItem>
                    </SelectContent>
                  </Select>
                  {["single", "multiple", "dropdown"].includes(question.type) && (
                    <>
                      {question.options?.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center mt-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-grow text-lg"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index, optionIndex)}
                            className="ml-2 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" onClick={() => addOption(index)} className="mt-2">
                        Add Option
                      </Button>
                    </>
                  )}
                  {question.type === "linear" && (
                    <div className="mt-4 space-y-4">
                      <div className="flex justify-between gap-4">
                        <div className="w-full">
                          <Label htmlFor={`minLabel-${index}`} className="text-sm font-medium text-muted-foreground">
                            Minimum Label
                          </Label>
                          <Input
                            id={`minLabel-${index}`}
                            value={question.minLabel || ""}
                            onChange={(e) => updateQuestion(index, "minLabel", e.target.value)}
                            placeholder="e.g., Not satisfied"
                            className="mt-1"
                          />
                        </div>
                        <div className="w-full">
                          <Label htmlFor={`maxLabel-${index}`} className="text-sm font-medium text-muted-foreground">
                            Maximum Label
                          </Label>
                          <Input
                            id={`maxLabel-${index}`}
                            value={question.maxLabel || ""}
                            onChange={(e) => updateQuestion(index, "maxLabel", e.target.value)}
                            placeholder="e.g., Very satisfied"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Input
                          type="number"
                          value={question.min || 1}
                          onChange={(e) => updateQuestion(index, "min", e.target.value)}
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
                          onChange={(e) => updateQuestion(index, "max", e.target.value)}
                          placeholder="Max"
                          className="w-20"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <CardFooter className="flex justify-end px-0">
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8">
                Update Poll
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

