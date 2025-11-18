"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if already logged in
    const isLoggedIn = sessionStorage.getItem("admin_logged_in")
    if (isLoggedIn === "true") {
      router.push("/admin")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Check for custom password (if user has reset it)
    const customPassword = localStorage.getItem("admin_password")
    const customUsername = localStorage.getItem("admin_username")
    
    let isValid = false
    
    if (customPassword && customUsername) {
      // Check custom credentials
      const decodedPassword = atob(customPassword)
      if (username === customUsername && password === decodedPassword) {
        isValid = true
      }
    }
    
    // Fallback to default credentials
    if (!isValid && username === "admin" && password === "admin123") {
      isValid = true
    }
    
    if (isValid) {
      sessionStorage.setItem("admin_logged_in", "true")
      sessionStorage.setItem("admin_username", username)
      router.push("/admin")
    } else {
      setError("Invalid username or password")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Link 
              href="/admin/reset-password" 
              className="text-sm text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-semibold mb-1">Default Credentials:</p>
            <p className="text-xs text-blue-700">Username: <span className="font-mono">admin</span></p>
            <p className="text-xs text-blue-700">Password: <span className="font-mono">admin123</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

