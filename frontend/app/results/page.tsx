"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Mock data for poll results
const mockResults = [
  { name: "JavaScript", votes: 30 },
  { name: "Python", votes: 25 },
  { name: "Java", votes: 20 },
  { name: "C++", votes: 15 },
  { name: "Ruby", votes: 10 },
]

export default function ResultsPage() {
  const [results, setResults] = useState([])

  useEffect(() => {
    // TODO: Fetch actual results from the backend
    setResults(mockResults)
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Poll Results</h1>
      <Card>
        <CardHeader>
          <CardTitle>Favorite Programming Language</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={results}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="votes" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

