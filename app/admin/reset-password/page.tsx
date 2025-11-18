"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"verify" | "reset">("verify")
  const [username, setUsername] = useState("")
  const [securityAnswer, setSecurityAnswer] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // For demo: Security question answer is "dhampus"
  const SECURITY_ANSWER = "dhampus"

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Check security answer (case insensitive)
    if (securityAnswer.toLowerCase().trim() === SECURITY_ANSWER.toLowerCase()) {
      setStep("reset")
      setLoading(false)
    } else {
      setError("Incorrect security answer. Please try again.")
      setLoading(false)
    }
  }

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validate passwords
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // In a real system, this would call an API to update the password
    // For now, we'll just store it in localStorage as a demo
    const hashedPassword = btoa(newPassword) // Simple encoding (use proper hashing in production)
    localStorage.setItem("admin_password", hashedPassword)
    localStorage.setItem("admin_username", username)
    
    setSuccess(true)
    setLoading(false)
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push("/admin/login")
    }, 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-3xl">✓</span>
            </div>
            <CardTitle className="text-2xl text-green-600">Password Reset Successful!</CardTitle>
            <CardDescription>
              Your password has been updated. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/admin/login" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft size={20} />
            </Link>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <span className="text-white font-bold text-xl">🔒</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {step === "verify" 
              ? "Answer the security question to reset your password"
              : "Enter your new password"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "verify" ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="securityAnswer">Security Question</Label>
                <p className="text-sm text-gray-600 mb-2">
                  What is the name of the lodge?
                </p>
                <Input
                  id="securityAnswer"
                  type="text"
                  placeholder="Your answer"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
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
                {loading ? "Verifying..." : "Verify Identity"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="bg-green-50 border border-green-200 px-4 py-3 rounded-lg mb-4">
                <p className="text-sm text-green-800">
                  ✓ Identity verified for: <strong>{username}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
                <p className="text-xs text-gray-500">
                  Must be at least 6 characters long
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep("verify")}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <Link 
              href="/admin/login" 
              className="text-sm text-primary hover:underline"
            >
              Back to Login
            </Link>
          </div>

          {step === "verify" && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 font-semibold mb-1">
                💡 Demo Mode - Security Info:
              </p>
              <p className="text-xs text-yellow-700">
                Security Answer: <span className="font-mono">dhampus</span>
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                (In production, only you would know this answer)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


