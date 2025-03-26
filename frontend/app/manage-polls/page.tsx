"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"

type Poll = {
  id: string
  title: string
  status: "Open" | "Closed"
}

export default function ManagePollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const router = useRouter()
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAdmin) {
      router.push("/")
    } else {
      // TODO: Fetch actual polls from the backend
      setPolls([
        { id: "1", title: "Favorite Programming Language", status: "Open" },
        { id: "2", title: "Best Frontend Framework", status: "Closed" },
      ])
    }
  }, [isAdmin, router])

  const handleEdit = (id: string) => {
    router.push(`/edit-poll/${id}`)
  }

  const handleDelete = (id: string) => {
    // TODO: Implement delete functionality
    setPolls(polls.filter((poll) => poll.id !== id))
    toast({
      title: "Poll deleted",
      description: "The poll has been successfully deleted.",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Manage Polls</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {polls.map((poll) => (
                <TableRow key={poll.id}>
                  <TableCell>{poll.title}</TableCell>
                  <TableCell>{poll.status}</TableCell>
                  <TableCell>
                    <Button variant="outline" className="mr-2" onClick={() => handleEdit(poll.id)}>
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(poll.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

