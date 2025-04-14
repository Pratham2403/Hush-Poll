"use client"

import { useState, useEffect } from "react"

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function PollTimer({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft())

  function calculateTimeLeft(): TimeLeft | null {
    const difference = endTime - Date.now()
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }
    return null
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime]) // Add endTime as a dependency

  if (!timeLeft) {
    return <div className="text-sm text-muted-foreground mt-2">Poll Ended</div>
  }

  // Hide days if there are none
  return (
    <div className="text-sm text-muted-foreground mt-2">
      Time left: {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
      {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </div>
  )
}

