import { useState, useEffect } from 'react'
import { Chat } from './components/Chat'
import { Sidebar } from './components/Sidebar'
import { Button } from './components/ui/button'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { supabase } from './lib/supabase'
import { User } from '@supabase/supabase-js'

export function App() {
  const [session, setSession] = useState<User | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null)
    })

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt')
        } else {
          console.log('User dismissed the install prompt')
        }
        setDeferredPrompt(null)
      })
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {session && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">NelsonGPT</h1>
          <div className="flex items-center space-x-4">
            {deferredPrompt && (
              <Button onClick={handleInstallClick}>Install App</Button>
            )}
            {session ? (
              <>
                <Button onClick={() => setIsSidebarOpen(!isSidebarOpen)} variant="outline">
                  {isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
                </Button>
                <Button onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <Button onClick={handleLogin}>Login with Google</Button>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4">
          {session ? (
            <Chat />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-2xl font-semibold mb-4">Welcome to NelsonGPT</h2>
              <p className="text-gray-600 mb-8">Please log in to start chatting.</p>
            </div>
          )}
        </div>
        <footer className="bg-white shadow-sm p-4 text-center">
          <a
            href="https://github.com/yourusername/nelsongpt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <GitHubLogoIcon className="w-4 h-4" />
            <span>View on GitHub</span>
          </a>
        </footer>
      </main>
    </div>
  )
}

