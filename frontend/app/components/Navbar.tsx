"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Menu, X, User, LogOut, PlusCircle, Home, BarChart3, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            Hush Poll
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex space-x-4 text-primary">
            <Button variant="ghost" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/create-poll">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Poll
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/results">
                <BarChart3 className="mr-2 h-4 w-4" />
                Results
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" asChild>
                <Link href="/manage-polls">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Polls
                </Link>
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/my-polls">My Polls</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/create-poll">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Poll
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/results">
                <BarChart3 className="mr-2 h-4 w-4" />
                Results
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/manage-polls">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Polls
                </Link>
              </Button>
            )}

            {user ? (
              <>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/my-polls">My Polls</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/profile">Profile</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="default" className="w-full" asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

