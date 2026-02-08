'use client'

import { useState } from 'react'
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

    setIsGenerating(true)

    // Add haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }

    try {
      const slug = nanoid(8)
      let iconUrl = null

      if (iconFile) {
        const resizedBlob = await resizeImage(iconFile)
        const fileName = `${slug}-${Date.now()}.jpg`
        
        const { error: uploadError } = await supabase.storage
          .from('icons')
          .upload(fileName, resizedBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600'
          })

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        const { data } = supabase.storage
          .from('icons')
          .getPublicUrl(fileName)
        
        iconUrl = data.publicUrl
      }

      const { error: dbError } = await supabase
        .from('links')
        .insert({
          slug,
          recipient_name: recipientName.trim(),
          creator_name: creatorName.trim(),
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
      
      try {
        await navigator.clipboard.writeText(shareMessage)
      } catch {}

    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Something went wrong')
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
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 md:p-6"
      style={{
        backgroundImage: 'url(/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Floating Capsule Container */}
      <div className="w-full max-w-[480px] relative z-10">
        
        {/* Header - Always visible */}
        <div className="text-center mb-8 md:mb-12 animate-float-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display text-white mb-3 drop-shadow-[0_8px_30px_rgba(0,0,0,0.4)] animate-float" style={{ textShadow: '0 2px 4px rgba(61,40,23,0.3), 0 4px 20px rgba(255,182,193,0.8)' }}>
            Ribbon 💌
          </h1>
          <p className="text-base md:text-lg font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(61,40,23,0.5), 0 0 20px rgba(255,182,193,0.6)' }}>
            Create a link. Send it. Watch them say yes.
          </p>
        </div>

        {generatedUrl ? (
          // SUCCESS STATE - Reveal animation
          <div className="aero-glass rounded-[2rem] p-8 md:p-10 space-y-6 animate-reveal">
            <div className="text-center space-y-4">
              <div className="text-6xl animate-bounce-in">✨</div>
              <h2 className="text-2xl md:text-3xl font-display text-chocolate">
                Your Link is Ready!
              </h2>
            </div>
            
            <div className="glass-inset rounded-2xl p-5 break-all font-mono text-sm text-chocolate/90">
              {generatedUrl}
            </div>

            <div className="flex items-center justify-center gap-2 text-chocolate/70 font-mono text-sm">
              <span className="text-lg">📋</span>
              <span>Message copied to clipboard!</span>
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
          <div className={`aero-glass rounded-[2rem] p-6 md:p-10 space-y-7 transition-all duration-700 ${
            isGenerating ? 'scale-110 blur-xl opacity-0 pointer-events-none' : 'scale-100 blur-0 opacity-100'
          }`}>
            
            {/* Error */}
            {errorMessage && (
              <div className="glass-error rounded-2xl p-5 border-2 border-red-300/60 backdrop-blur-xl animate-shake">
                <p className="font-mono text-red-700 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </p>
              </div>
            )}

            {/* Recipient Name */}
            <div className="space-y-3">
              <label className="block font-display text-xl md:text-2xl text-chocolate/90">
                Who's the lucky one? 💝
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                maxLength={15}
                placeholder="Their name..."
                className="aero-input"
              />
              <p className="text-xs font-mono text-chocolate/50 px-2">
                {recipientName.length}/15 characters
              </p>
            </div>

            {/* Anonymous Toggle */}
            <div className="glass-panel rounded-2xl p-5">
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="heart-checkbox">
                  <span className="peer-checked:hidden text-2xl opacity-40">🤍</span>
                  <span className="hidden peer-checked:inline text-2xl animate-heart-pop">💖</span>
                </div>
                <div className="flex-1 space-y-1.5">
                  <span className="font-display text-lg block text-chocolate/90 group-hover:text-chocolate transition-colors">
                    🎭 Send Anonymously
                  </span>
                  <span className="font-mono text-xs text-chocolate/60 block leading-relaxed">
                    Your identity will only be revealed if they say yes!
                  </span>
                </div>
              </label>
            </div>

            {/* Creator Name */}
            <div className="space-y-3">
              <label className="block font-display text-xl md:text-2xl text-chocolate/90">
                What's your name? ✨
                {isAnonymous && (
                  <span className="text-xs font-mono text-chocolate/60 block mt-2 font-normal">
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
              />
            </div>

            {/* Theme Selector */}
            <div className="space-y-3">
              <label className="block font-display text-xl md:text-2xl text-chocolate/90">
                Pick a vibe 🎨
              </label>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`vibe-card aspect-square rounded-3xl p-3 transition-all duration-300 min-h-[48px] ${
                      selectedTheme.id === theme.id
                        ? 'vibe-card-selected scale-105'
                        : 'hover:scale-102'
                    }`}
                  >
                    <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-2xl md:text-3xl shadow-inner border-t-4 border-white/80`}>
                      {theme.emoji}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <label className="block font-display text-xl md:text-2xl text-chocolate/90">
                Add an image  (optional) 
              </label>

              {iconFile ? (
                <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {iconPreview && (
                      <img 
                        src={iconPreview} 
                        alt="Preview" 
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white/60"
                      />
                    )}
                    <p className="font-mono text-sm text-chocolate/70">
                      Image uploaded
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIconFile(null)
                      setIconPreview(null)
                    }}
                    className="font-mono text-sm text-red-600 hover:text-red-700 underline transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="upload-zone block w-full p-8 md:p-10 border-2 border-dashed border-white/40 rounded-2xl cursor-pointer hover:border-white/60 hover:bg-white/10 transition-all backdrop-blur-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="text-center space-y-2">
                    <p className="text-4xl">📷</p>
                    <p className="font-mono text-chocolate/70 text-sm">
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
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin">⏳</span>
                  Creating Magic...
                </span>
              ) : (
                'Generate My Link'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}