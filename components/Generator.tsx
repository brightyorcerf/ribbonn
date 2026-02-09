'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'

type Theme = {
  id: number
  name: string
  primary: string
  secondary: string
  gradient: string
  emoji: string
}

const THEMES: Theme[] = [
  { 
    id: 1, 
    name: 'Classic Red', 
    primary: '#E60012', 
    secondary: '#FFB3D9',
    gradient: 'from-[#ff85a1] via-[#ff4d6d] to-[#c9184a]',
    emoji: '❤️'
  },
  { 
    id: 2, 
    name: 'Soft Pink', 
    primary: '#FFB3D9', 
    secondary: '#FFC0E5',
    gradient: 'from-[#FFB3D9] via-[#FFC0E5] to-[#FFD1ED]',
    emoji: '🌸'
  },
  { 
    id: 3, 
    name: 'Cyber Lavender', 
    primary: '#B19CD9', 
    secondary: '#D4C5F9',
    gradient: 'from-[#B19CD9] via-[#D4C5F9] to-[#E8DDFF]',
    emoji: '💜'
  },
]

// 🔒 security: Sanitize user input to prevent XSS
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 50) // Hard limit
}

export default function Generator() {
  const [recipientName, setRecipientName] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0])
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastGenTime, setLastGenTime] = useState(0) // ⚡ Rate limiting
  const [clipboardCopied, setClipboardCopied] = useState(false)

  useEffect(() => {
    document.body.classList.add('generator-bg')
    return () => {
      document.body.classList.remove('generator-bg')
    }
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image must be smaller than 5MB')
      return
    }

    setIconFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setIconPreview(reader.result as string)
    }
    reader.onerror = () => {
      setErrorMessage('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          
          canvas.width = 400
          canvas.height = 400
          
          const size = Math.min(img.width, img.height)
          const x = (img.width - size) / 2
          const y = (img.height - size) / 2
          
          ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400)
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          }, 'image/jpeg', 0.9)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleGenerate = async () => {
    setErrorMessage(null)
    setClipboardCopied(false)

    // ⚡ RATE LIMITING: Prevent spam
    const now = Date.now()
    if (now - lastGenTime < 3000) {
      setErrorMessage('Please wait a moment before creating another link...')
      return
    }

    // Validation
    if (!recipientName.trim()) {
      setErrorMessage('Please enter a recipient name')
      return
    }

    if (!creatorName.trim()) {
      setErrorMessage('Please enter your name')
      return
    }

    if (recipientName.length > 15) {
      setErrorMessage('Recipient name must be 15 characters or less')
      return
    }

    if (creatorName.length > 20) {
      setErrorMessage('Your name must be 20 characters or less')
      return
    }

    setIsGenerating(true)
    setLastGenTime(now)

    // Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }

    try {
      const slug = nanoid(8)
      let iconUrl = null

      if (iconFile) {
        const resizedBlob = await resizeImage(iconFile)
        // 🔒 SECURITY: Add random string to prevent collisions
        const fileName = `${slug}-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
        
        const { error: uploadError } = await supabase.storage
          .from('icons')
          .upload(fileName, resizedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false // Don't overwrite if exists
          })

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        const { data } = supabase.storage
          .from('icons')
          .getPublicUrl(fileName)
        
        iconUrl = data.publicUrl
      }

      // 🔒 SECURITY: Sanitize all user inputs
      const { error: dbError } = await supabase
        .from('links')
        .insert({
          slug,
          recipient_name: sanitizeInput(recipientName),
          creator_name: sanitizeInput(creatorName),
          theme_id: selectedTheme.id,
          icon_url: iconUrl,
          is_anonymous: isAnonymous,
        })

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      const url = `${window.location.origin}/be-mine/${slug}`
      setGeneratedUrl(url)

      const shareMessage = isAnonymous
        ? `Someone made you something special 💝\n${url}\n\n(I don't know who sent this, just passing it along!)`
        : `Hey! I made you something 💝\n${url}`
      
      // ✅ IMPROVED: Better clipboard handling
      try {
        await navigator.clipboard.writeText(shareMessage)
        setClipboardCopied(true)
      } catch (err) {
        console.warn('Clipboard API not available:', err)
        // Fallback: user can still copy manually from the displayed URL
      }

    } catch (error) {
      console.error('Generation error:', error)
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Something went wrong. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setRecipientName('')
    setCreatorName('')
    setIsAnonymous(false)
    setSelectedTheme(THEMES[0])
    setIconFile(null)
    setIconPreview(null)
    setGeneratedUrl(null)
    setErrorMessage(null)
    setClipboardCopied(false)
  }

  const copyToClipboard = async () => {
    if (!generatedUrl) return
    
    try {
      await navigator.clipboard.writeText(generatedUrl)
      setClipboardCopied(true)
      setTimeout(() => setClipboardCopied(false), 2000)
    } catch (err) {
      console.warn('Copy failed:', err)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Floating Capsule Container */}
      <div className="w-full max-w-[380px] sm:max-w-[420px] md:max-w-[480px] relative z-10">
        
        {/* Header - Always visible */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12 animate-float-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display text-white mb-2 sm:mb-3 drop-shadow-[0_8px_30px_rgba(0,0,0,0.4)] animate-float" style={{ textShadow: '0 2px 4px rgba(61,40,23,0.3), 0 4px 20px rgba(255,182,193,0.8)' }}>
            Ribbon 💌
          </h1>
          <p className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow-lg px-4" style={{ textShadow: '0 2px 8px rgba(61,40,23,0.5), 0 0 20px rgba(255,182,193,0.6)' }}>
            Create a link. Send it. Watch them say yes.
          </p>
        </div>

        {generatedUrl ? (
          // SUCCESS STATE - Reveal animation
          <div className="aero-glass rounded-[2rem] p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6 animate-reveal">
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="text-5xl sm:text-6xl animate-bounce-in">✨</div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display text-chocolate">
                Your Link is Ready!
              </h2>
            </div>
            
            <div className="glass-inset rounded-2xl p-4 sm:p-5 break-all font-mono text-xs sm:text-sm text-chocolate/90">
              {generatedUrl}
            </div>

            {/* ✅ FIXED: Proper clipboard status display */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-chocolate/70 font-mono text-xs sm:text-sm">
              {clipboardCopied ? (
                <>
                  <span className="text-base sm:text-lg">✅</span> 
                </>
              ) : (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/70 rounded-full transition-colors"
                >
                  <span className="text-base sm:text-lg"></span>
                  <span>Copy Link</span>
                </button>
              )}
            </div>

            <button
              onClick={handleReset}
              className="btn-plastic w-full"
            >
              Make Another One 
            </button>
          </div>
        ) : (
          // FORM STATE - With evaporation transition
          <div className={`aero-glass rounded-[2rem] p-5 sm:p-6 md:p-10 space-y-5 sm:space-y-6 md:space-y-7 transition-all duration-700 ${
            isGenerating ? 'scale-110 blur-xl opacity-0 pointer-events-none' : 'scale-100 blur-0 opacity-100'
          }`}>
            
            {/* Error */}
            {errorMessage && (
              <div className="glass-error rounded-2xl p-4 sm:p-5 border-2 border-red-300/60 backdrop-blur-xl animate-shake">
                <p className="font-mono text-red-700 text-xs sm:text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </p>
              </div>
            )}

            {/* Recipient Name */}
            <div className="space-y-2 sm:space-y-3">
              <label className="block font-display text-lg sm:text-xl md:text-2xl text-chocolate/90">
                Who's the lucky one? 
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                maxLength={15}
                placeholder="Their name..."
                className="aero-input"
                aria-label="Recipient name"
              />
              <p className={`text-xs font-mono px-2 transition-colors ${
                recipientName.length > 12 
                  ? 'text-red-600 font-bold' 
                  : 'text-chocolate/50'
              }`}>
                {recipientName.length}/15 characters
              </p>
            </div>

            {/* Anonymous Toggle */}
            <div className="glass-panel rounded-2xl p-4 sm:p-5">
              <label className="flex items-start gap-3 sm:gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="peer sr-only"
                  aria-label="Send anonymously"
                />
                <div className="heart-checkbox">
                  <span className="peer-checked:hidden text-xl sm:text-2xl opacity-40" aria-hidden="true">🤍</span>
                  <span className="hidden peer-checked:inline text-xl sm:text-2xl animate-heart-pop" aria-hidden="true">💖</span>
                </div>
                <div className="flex-1 space-y-1 sm:space-y-1.5">
                  <span className="font-display text-base sm:text-lg block text-chocolate/90 group-hover:text-chocolate transition-colors">
                    🎭 Send Anonymously
                  </span>
                  <span className="font-mono text-xs text-chocolate/60 block leading-relaxed">
                    Your identity will only be revealed if they say yes!
                  </span>
                </div>
              </label>
            </div>

            {/* Creator Name */}
            <div className="space-y-2 sm:space-y-3">
              <label className="block font-display text-lg sm:text-xl md:text-2xl text-chocolate/90">
                What's your name? ✨
                {isAnonymous && (
                  <span className="text-xs font-mono text-chocolate/60 block mt-1 sm:mt-2 font-normal">
                    (Kept secret until they say yes)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                maxLength={20}
                placeholder="Your name..."
                className="aero-input"
                aria-label="Your name"
              />
            </div>

            {/* Theme Selector */}
            <div className="space-y-2 sm:space-y-3">
              <label className="block font-display text-lg sm:text-xl md:text-2xl text-chocolate/90">
                Pick a vibe 🎨
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Theme selection">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`vibe-card rounded-2xl sm:rounded-3xl p-2 sm:p-3 transition-all duration-300 ${
                      selectedTheme.id === theme.id
                        ? 'vibe-card-selected scale-105'
                        : 'hover:scale-102'
                    }`}
                    role="radio"
                    aria-checked={selectedTheme.id === theme.id}
                    aria-label={`${theme.name} theme`}
                  >
                    <div className={`w-full aspect-square rounded-xl sm:rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-inner border-t-2 sm:border-t-4 border-white/80`}>
                      <span className="text-3xl sm:text-4xl leading-none" style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '48px',
                        minWidth: '48px'
                      }} aria-hidden="true">
                        {theme.emoji}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2 sm:space-y-3">
              <label className="block font-display text-lg sm:text-xl md:text-2xl text-chocolate/90">
                Add an image  (optional) 
              </label>

              {iconFile ? (
                <div className="glass-panel rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {iconPreview && (
                      <img 
                        src={iconPreview} 
                        alt="Uploaded profile preview" 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-white/60 flex-shrink-0"
                      />
                    )}
                    <p className="font-mono text-xs sm:text-sm text-chocolate/70 truncate">
                      Image uploaded
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIconFile(null)
                      setIconPreview(null)
                    }}
                    className="font-mono text-xs sm:text-sm text-red-600 hover:text-red-700 underline transition-colors flex-shrink-0"
                    aria-label="Remove uploaded image"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="upload-zone block w-full p-6 sm:p-8 md:p-10 border-2 border-dashed border-white/40 rounded-2xl cursor-pointer hover:border-white/60 hover:bg-white/10 transition-all backdrop-blur-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    aria-label="Upload profile image"
                  />
                  <div className="text-center space-y-1.5 sm:space-y-2">
                    <p className="text-3xl sm:text-4xl" aria-hidden="true">📷</p>
                    <p className="font-mono text-chocolate/70 text-xs sm:text-sm">
                      Click to upload
                    </p>
                    <p className="font-mono text-chocolate/50 text-xs">
                      Max 5MB
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-plastic w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              aria-label="Generate your link"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className="animate-spin" aria-hidden="true">⏳</span>
                  <span className="text-base sm:text-lg md:text-xl">Creating Magic...</span>
                </span>
              ) : (
                <span className="text-base sm:text-lg md:text-xl">Generate My Link</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}