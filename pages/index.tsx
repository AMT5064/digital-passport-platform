import React from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Zap, Users, TrendingUp, QrCode, Award, BarChart3 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()

  React.useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      if (session.user.role === 'ATTENDEE') {
        router.push('/passport')
      } else {
        router.push('/admin')
      }
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center animate-scale-in">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          </div>
          <p className="text-gray-300 font-medium">Preparing your experience...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: <QrCode className="w-8 h-8" />,
      title: 'Smart QR Codes',
      description: 'Generate and scan QR codes at booths to unlock activities and earn points'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Engaging Activities',
      description: 'Participate in quizzes, polls, surveys, and games to maximize your score'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Live Leaderboard',
      description: 'Compete with other participants and see rankings update in real-time'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Earn Rewards',
      description: 'Unlock badges and rewards based on your engagement and achievements'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Team Analytics',
      description: 'Organizers can track engagement and manage multiple events easily'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Detailed Analytics',
      description: 'Get insights into participant behavior and event performance metrics'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center font-bold text-lg">
              DP
            </div>
            <span className="font-bold text-xl">Digital Passport</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <span className="px-4 py-2 text-white hover:text-blue-400 transition-colors font-medium cursor-pointer">
                Sign In
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container-wide py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="animate-slide-in-left">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Engage Your <span className="text-gradient">Event Audience</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Transform your booth experience with interactive QR codes, gamification, and real-time engagement tracking. Make every visitor memorable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/register">
                <button className="btn btn-primary btn-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl">
                  Get Started Free
                  <Zap className="w-5 h-5 ml-2" />
                </button>
              </Link>
              <Link href="/login">
                <button className="btn btn-outline btn-lg border-gray-400 text-white hover:bg-white/10">
                  Sign In
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-300">
              <div>
                <p className="font-semibold text-white">500+</p>
                <p>Active Events</p>
              </div>
              <div className="h-8 w-px bg-gray-600"></div>
              <div>
                <p className="font-semibold text-white">50K+</p>
                <p>Happy Participants</p>
              </div>
              <div className="h-8 w-px bg-gray-600"></div>
              <div>
                <p className="font-semibold text-white">99.9%</p>
                <p>Uptime</p>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="animate-slide-in-right hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-30"></div>
              <div className="relative bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur border border-white/20 rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="h-32 bg-white/5 rounded-lg animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-white/5 rounded-lg animate-pulse"></div>
                    <div className="h-20 bg-white/5 rounded-lg animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <div className="h-16 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-md py-20">
        <div className="container-wide">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Everything You Need to <span className="text-gradient">Captivate Your Audience</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card group hover:border-blue-500/50 hover:bg-blue-500/5 bg-white/5 border-white/10"
                style={{ animation: `slideIn 0.5s ease-out ${index * 0.1}s both` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center text-gray-900 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 container-wide py-20 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Launch?</h2>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Join thousands of organizers who are creating unforgettable event experiences
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <button className="btn btn-primary btn-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl">
              Register Now
            </button>
          </Link>
          <Link href="/login">
            <button className="btn btn-outline btn-lg border-gray-400 text-white hover:bg-white/10">
              Already Have Account?
            </button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-md py-8 mt-20">
        <div className="container-wide text-center text-gray-400">
          <p>&copy; 2024 Digital Passport. Transform your events, engage your audiences.</p>
        </div>
      </footer>
    </div>
  )
}
