"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { adminAPI, pollsAPI } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

type Poll = {
  _id: string;
  title: string;
  questions: {
    text: string;
    type: string;
    options: string[];
    minValue?: number;
    maxValue?: number;
  }[];
  isPublic: boolean;
  expiration: string;
  createdAt: string;
};

export default function ManagePollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isAdmin, isLoggedIn } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    fetchPolls();
  }, [isLoggedIn, isAdmin, router]);

  const fetchPolls = async () => {
    try {
      setLoading(true);

      // Fetch either admin polls or user polls depending on role
      const data = isAdmin
        ? await adminAPI.getAllPolls()
        : await pollsAPI.getUserPolls();

      setPolls(data);
    } catch (error) {
      toast({
        title: "Failed to fetch polls",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/edit-poll/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      // Use the appropriate API based on user role
      if (isAdmin) {
        await adminAPI.deletePoll(id);
      } else {
        // TODO: Implement user poll deletion in the API
        await pollsAPI.deletePoll(id);
      }

      // Remove the poll from the state
      setPolls(polls.filter((poll) => poll._id !== id));

      toast({
        title: "Poll deleted",
        description: "The poll has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete poll",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const isPollActive = (expirationDate: string) => {
    return new Date(expirationDate) > new Date();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Manage Polls</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No polls found</p>
              <Button
                onClick={() => router.push("/create-poll")}
                className="mt-4"
              >
                Create a Poll
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {polls.map((poll) => (
                  <TableRow key={poll._id}>
                    <TableCell className="font-medium">{poll.title}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isPollActive(poll.expiration)
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isPollActive(poll.expiration) ? "Active" : "Expired"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {poll.isPublic ? "Public" : "Private"}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(poll.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/poll/${poll._id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(poll._id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(poll._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
