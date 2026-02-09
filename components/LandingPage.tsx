'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase, type Link } from '@/lib/supabase'
import gsap from 'gsap'

type LandingPageProps = {
  link: Link
}

const THEME_BACKGROUNDS: Record<number, string> = {
  1: '/backgrounds/bg1.jpg',
  2: '/backgrounds/bg2.jpg',
  3: '/backgrounds/bg3.jpg',
}

const THEME_COLORS: Record<number, { 
  primary: string
  secondary: string
  accent: string
  emoji: string
}> = {
  1: { 
    primary: '#E60012', 
    secondary: '#FFB3D9',
    accent: '#FF6B9D',
    emoji: '❤️'
  },
  2: { 
    primary: '#FFB3D9',
    secondary: '#FFC0E5',
    accent: '#FF85C0',
    emoji: '🌸'
  },
  3: { 
    primary: '#B19CD9',
    secondary: '#D4C5F9',
    accent: '#9D7FDB',
    emoji: '💜'
  },
}

const generateSparkles = () => {
  return [...Array(10)].map(() => ({
    left: 10 + Math.random() * 80,
    top: 10 + Math.random() * 80,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
  }))
}

export default function LandingPage({ link }: LandingPageProps) {
  const [response, setResponse] = useState<'yes' | 'no' | null>(null)
  const [showIdentity, setShowIdentity] = useState(false)
  const [sparkles, setSparkles] = useState<Array<{left: number, top: number, delay: number, duration: number}>>([])
  const [noClickCount, setNoClickCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const confettiCreatedRef = useRef(false) // ✅ FIXED: Prevent confetti spam

  const themeId = Number(link.theme_id)
  const theme = THEME_COLORS[themeId] || THEME_COLORS[1] // ✅ FIXED: Fallback theme
  const backgroundImage = THEME_BACKGROUNDS[themeId]

  useEffect(() => {
    setSparkles(generateSparkles())
  }, [])

  const handleYes = async () => {
    if (isProcessing) return // Prevent double-click
    setIsProcessing(true)

    try {
      const { error } = await supabase
        .from('links')
        .update({ response: 'yes' })
        .eq('slug', link.slug)

      if (error) {
        console.error('Failed to update response:', error)
        alert('Something went wrong. Please try again.')
        setIsProcessing(false)
        return
      }

      setResponse('yes')
      createConfetti()
      
      if (link.is_anonymous && link.creator_name) {
        setTimeout(() => {
          setShowIdentity(true)
        }, 1500)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleNo = () => {
    if (isProcessing) return
    
    if (noClickCount < 3) {
      const button = document.getElementById('no-button')
      if (button) {
        gsap.to(button, {
          scale: 1 - (noClickCount + 1) * 0.25,
          rotation: 10,
          yoyo: true,
          repeat: 5,
          duration: 0.1,
        })
      }
      setNoClickCount(noClickCount + 1)
    } else {
      finalNo()
    }
  }

  const finalNo = async () => {
    if (isProcessing) return
    setIsProcessing(true)

    try {
      const { error } = await supabase
        .from('links')
        .update({ response: 'no' })
        .eq('slug', link.slug)

      if (error) {
        console.error('Failed to update response:', error)
        alert('Something went wrong. Please try again.')
        setIsProcessing(false)
        return
      }

      setResponse('no')
      document.body.style.filter = 'grayscale(100%)'
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
      setIsProcessing(false)
    }
  }

  // ✅ FIXED: Prevent confetti spam with ref
  const createConfetti = () => {
    if (confettiCreatedRef.current) return
    confettiCreatedRef.current = true

    const confettiCount = 40

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.textContent = i % 2 === 0 ? theme.emoji : '✨'
      confetti.setAttribute('data-confetti', 'true') // Mark for cleanup
      confetti.style.cssText = `
        position: fixed;
        font-size: ${16 + Math.random() * 12}px;
        top: 50%;
        left: 50%;
        z-index: 9999;
        pointer-events: none;
      `
      document.body.appendChild(confetti)

      gsap.to(confetti, {
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 800,
        rotation: Math.random() * 360,
        opacity: 0,
        duration: 1.5 + Math.random(),
        ease: 'power2.out',
        onComplete: () => confetti.remove(),
      })
    }
  }

  const getNoButtonText = () => {
    switch (noClickCount) {
      case 0: return 'No'
      case 1: return 'Really?'
      case 2: return 'Sure?'
      default: return 'Okay... 😢'
    }
  }

  // ✅ IMPROVED: Background with fallback
  const getBackgroundStyle = () => {
    const baseStyle = {
      backgroundColor: theme.primary,
      backgroundSize: 'cover' as const, 
      backgroundPosition: 'center top' as const,
      backgroundRepeat: 'no-repeat' as const,
    }

    if (backgroundImage) {
      return {
        ...baseStyle,
        backgroundImage: `
          linear-gradient(
            135deg,
            ${theme.primary}15 0%,
            ${theme.secondary}25 100%
          ),
          url(${backgroundImage})
        `,
      }
    }

    // Fallback gradient if image not available
    return {
      ...baseStyle,
      backgroundImage: `
        linear-gradient(
          135deg,
          ${theme.primary} 0%,
          ${theme.secondary} 100%
        )
      `,
    }
  }

  // YES STATE
  if (response === 'yes') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-8 md:p-12"
        style={getBackgroundStyle()}
      >
        <div 
          className="absolute inset-8 md:inset-16 border-8 rounded-[60px] pointer-events-none"
          style={{ borderColor: theme.primary }}
          aria-hidden="true"
        />

        <div className="relative z-10 text-center max-w-2xl w-full px-8 space-y-10">
          <p className="text-6xl md:text-8xl font-display text-white" role="status" aria-live="polite">
            🎉 YES! 🎉
          </p>
          
          {link.is_anonymous && link.creator_name && (
            <div 
              className={`bg-white p-10 rounded-chunky border-4 border-chocolate shadow-hard-chocolate space-y-5 transition-all duration-500 ${
                showIdentity ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              aria-live="polite"
            >
              <p className="font-display text-3xl text-chocolate">
                It was...
              </p>
              <p 
                className="font-display text-6xl break-words"
                style={{ color: theme.primary }}
              >
                {link.creator_name}! 
              </p>
            </div>
          )}
          
          <div className="bg-white p-10 rounded-chunky border-4 border-chocolate shadow-hard-chocolate space-y-8">
            <p className="text-3xl font-display text-chocolate leading-relaxed">
              {link.creator_name || 'They'} is over the moon! 💖
            </p>

            <div className="border-t-2 border-chocolate/20 pt-8 space-y-4">
              <p className="font-mono text-chocolate/60 text-sm">
                📸 Screenshot this moment!
              </p>
              <p className="font-display text-2xl text-chocolate break-words">
                {link.recipient_name} said YES
              </p>
              <p className="font-mono text-chocolate/70">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <a
            href="/"
            className="inline-block bg-sanrio-red text-white font-display text-xl py-5 px-10 rounded-chunky border-4 border-chocolate shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            Make Your Own Link 🎀
          </a>
        </div>
      </div>
    )
  }

  // NO STATE
  if (response === 'no') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 md:p-12 bg-cream">
        <div className="text-center max-w-2xl w-full px-8 space-y-10">
          <p className="text-6xl md:text-8xl font-display text-chocolate/50" role="status" aria-live="polite">
            💔
          </p>
          
          <p className="text-4xl font-display text-chocolate/70">
            That's heartbreaking...
          </p>
          
          <p className="text-xl font-mono text-chocolate/50">
            {link.creator_name 
              ? `${link.creator_name} will understand... 😢`
              : "They'll understand... 😢"
            }
          </p>

          <div className="space-y-6">
            <p className="font-mono text-chocolate/70">
              Want to take YOUR shot?
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-sanrio-lavender text-white font-display text-xl py-5 px-10 rounded-chunky border-4 border-chocolate shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              Make My Own Link 💘
            </button>
          </div>
        </div>
      </div>
    )
  }

  // DEFAULT STATE
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 md:p-12 relative overflow-hidden"
      style={getBackgroundStyle()}
    >
      {/* Border */}
      <div 
        className="absolute inset-8 md:inset-16 border-8 rounded-[60px] pointer-events-none"
        style={{ borderColor: theme.primary }}
        aria-hidden="true"
      />

      {/* Corner emojis */}
      <div className="absolute top-12 left-12 text-4xl opacity-40" aria-hidden="true">{theme.emoji}</div>
      <div className="absolute top-12 right-12 text-4xl opacity-40" aria-hidden="true">{theme.emoji}</div>
      <div className="absolute bottom-12 left-12 text-4xl opacity-40" aria-hidden="true">{theme.emoji}</div>
      <div className="absolute bottom-12 right-12 text-4xl opacity-40" aria-hidden="true">{theme.emoji}</div>

      {/* Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {sparkles.map((sparkle, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-15 animate-float"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl w-full px-8 space-y-10">
        
        {/* Small profile image */}
        {link.icon_url && (
          <div className="flex justify-center">
            <img
              src={link.icon_url}
              alt={`Profile picture for ${link.recipient_name}`}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full border-6 border-chocolate shadow-hard-chocolate object-cover"
              onError={(e) => {
                // ✅ IMPROVED: Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Greeting */}
        <p
          className="text-3xl sm:text-4xl md:text-5xl font-display font-bold break-words leading-tight" 
          style={{ 
            color: '#FFFFFF',
            textShadow: `
              0 2px 6px rgba(0,0,0,0.35),
              0 0 18px rgba(255,255,255,0.35)
            `
          }}
        >
          Hey {link.recipient_name}! 
        </p>

        {/* From */}
        {!link.is_anonymous && link.creator_name && (
          <p 
            className="text-2xl font-mono font-bold break-words"
            style={{ 
              color: '#FFFFFF',
              textShadow: '0 3px 10px rgba(0,0,0,0.8), 0 6px 20px rgba(0,0,0,0.6), 2px 2px 0 rgba(0,0,0,0.3)'
            }}
          >
            From: <span style={{ 
              color: '#FFFFFF',
              textShadow: '0 3px 10px rgba(0,0,0,0.8), 0 6px 20px rgba(0,0,0,0.6), 0 0 30px rgba(255,182,193,0.6), 2px 2px 0 rgba(0,0,0,0.3)'
            }}>{link.creator_name}</span> 
          </p>
        )}

        {/* Question card */}
        <div className="bg-white p-6 md:p-12 rounded-chunky border-4 border-chocolate shadow-hard-chocolate space-y-6 md:space-y-10">
          <p className="text-3xl md:text-5xl font-display text-chocolate leading-tight">
            Will you be mine? 
          </p>

          {/* Buttons - proper sizing */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={handleYes}
              disabled={isProcessing}
              className="bg-sanrio-red text-white font-display text-2xl py-5 px-14 rounded-chunky border-4 border-chocolate shadow-hard-chocolate hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Say yes"
            >
              YES! 💝
            </button>

            <button
              id="no-button"
              onClick={handleNo}
              disabled={isProcessing}
              className="bg-chocolate/10 text-chocolate font-display text-2xl py-5 px-14 rounded-chunky border-4 border-chocolate/30 hover:border-chocolate/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                transform: `scale(${1 - noClickCount * 0.25})`,
              }}
              aria-label={getNoButtonText()}
            >
              {getNoButtonText()}
            </button>
          </div>

          {noClickCount > 0 && noClickCount < 3 && (
            <p className="font-mono text-sm text-chocolate/60 animate-pulse pt-4" role="status" aria-live="polite">
              {noClickCount === 1 && "Think about it..."}
              {noClickCount === 2 && "Last chance! 💔"}
            </p>
          )}
        </div>

        {/* Anonymous hint */}
        {link.is_anonymous && (
          <p className="text-sm font-mono text-chocolate/50 px-8 py-5 bg-white/70 rounded-chunky border-2 border-chocolate/20">
            🎭 Secret admirer... click "YES" to find out who! 
          </p>
        )}
      </div>
    </div>
  )
}