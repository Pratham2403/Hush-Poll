"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { PollTimer } from "@/components/PollTimer"
import { Copy, ExternalLink, BarChart2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type Poll = {
  id: string
  title: string
  description: string
  status: "Open" | "Closed"
  endTime: number
  image?: string
  votes: number
}

export default function MyPollsPage() {
  const [activePolls, setActivePolls] = useState<Poll[]>([])
  const [closedPolls, setClosedPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user, isLoggedIn } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoggedIn) {
      toast({
        title: "Authentication required",
        description: "Please log in to view your polls",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    // TODO: Replace with actual API call
    // const fetchPolls = async () => {
    //   try {
    //     const response = await fetch('/api/polls/my-polls')
    //     const data = await response.json()
    //     if (!response.ok) throw new Error(data.message)
    //
    //     setActivePolls(data.activePolls)
    //     setClosedPolls(data.closedPolls)
    //   } catch (error) {
    //     console.error(error)
    //     toast({
    //       title: "Failed to load polls",
    //       description: "Please try again later",
    //       variant: "destructive",
    //     })
    //   } finally {
    //     setIsLoading(false)
    //   }
    // }

    // Mock data
    setTimeout(() => {
      setActivePolls([
        {
          id: "1",
          title: "Favorite Programming Language",
          description: "What's your go-to language?",
          status: "Open",
          endTime: Date.now() + 3600000,
          image: "/placeholder.svg?height=100&width=200",
          votes: 42,
        },
        {
          id: "3",
          title: "Best Code Editor",
          description: "Which code editor do you prefer?",
          status: "Open",
          endTime: Date.now() + 7200000,
          votes: 18,
        },
      ])

      setClosedPolls([
        {
          id: "2",
          title: "Best Frontend Framework",
          description: "React, Vue, or Angular?",
          status: "Closed",
          endTime: Date.now() - 3600000,
          image: "/placeholder.svg?height=100&width=200",
          votes: 87,
        },
      ])

      setIsLoading(false)
    }, 1000)
  }, [isLoggedIn, router, toast])

  const copyPollLink = async (id: string) => {
    const link = `${window.location.origin}/poll/${id}`
    try {
      await navigator.clipboard.writeText(link)
      toast({
        title: "Link copied",
        description: "Poll link copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading your polls...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">My Polls</h1>
        <Button onClick={() => router.push("/create-poll")}>Create New Poll</Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="active">Active Polls ({activePolls.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed Polls ({closedPolls.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activePolls.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CardDescription className="text-center mb-4">You don't have any active polls yet.</CardDescription>
                <Button onClick={() => router.push("/create-poll")}>Create Your First Poll</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePolls.map((poll) => (
                <Card
                  key={poll.id}
                  className="h-full hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-background to-secondary/10"
                >
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary">{poll.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col h-full">
                    {poll.image && (
                      <img
                        src={poll.image || "/placeholder.svg"}
                        alt={poll.title}
                        className="w-full h-32 object-cover rounded-md mb-4"
                      />
                    )}
                    <p className="text-muted-foreground mb-2 flex-grow">{poll.description}</p>
                    <div className="mt-auto space-y-2">
                      <PollTimer endTime={poll.endTime} />
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          {poll.votes} votes
                        </Badge>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyPollLink(poll.id)}
                            aria-label="Copy poll link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" asChild aria-label="View poll">
                            <Link href={`/poll/${poll.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild aria-label="View results">
                            <Link href={`/results/${poll.id}`}>
                              <BarChart2 className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed">
          {closedPolls.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CardDescription className="text-center">You don't have any closed polls yet.</CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {closedPolls.map((poll) => (
                <Card key={poll.id} className="h-full bg-gradient-to-br from-background to-secondary/5">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary">{poll.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col h-full">
                    {poll.image && (
                      <img
                        src={poll.image || "/placeholder.svg"}
                        alt={poll.title}
                        className="w-full h-32 object-cover rounded-md mb-4 opacity-70"
                      />
                    )}
                    <p className="text-muted-foreground mb-2 flex-grow">{poll.description}</p>
                    <div className="mt-auto space-y-2">
                      <div className="text-sm text-muted-foreground">Poll Ended</div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                          {poll.votes} votes
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/results/${poll.id}`}>
                            <BarChart2 className="h-4 w-4 mr-2" />
                            View Results
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

