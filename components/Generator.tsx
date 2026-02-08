'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { nanoid } from 'nanoid'

type Theme = {
  id: number
  name: string
  primary: string
  secondary: string
  bgClass: string
  emoji: string
}

const THEMES: Theme[] = [
  { 
    id: 1, 
    name: 'Classic Red', 
    primary: '#E60012', 
    secondary: '#FFB3D9',
    bgClass: 'bg-sanrio-red',
    emoji: '❤️'
  },
  { 
    id: 2, 
    name: 'Soft Pink', 
    primary: '#FFB3D9', 
    secondary: '#FFC0E5',
    bgClass: 'bg-sanrio-pink',
    emoji: '🌸'
  },
  { 
    id: 3, 
    name: 'Cyber Lavender', 
    primary: '#B19CD9', 
    secondary: '#D4C5F9',
    bgClass: 'bg-sanrio-lavender',
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
    <div className="w-full max-w-3xl mx-auto px-6 py-10">
      
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-display text-sanrio-red mb-6 animate-float">
          Ribbon 🎀
        </h1>
        <p className="text-lg md:text-xl font-mono text-chocolate/70">
          Create a link. Send it. Watch them say yes.
        </p>
      </div>

      {generatedUrl ? (
        // SUCCESS STATE
        <div className="bg-white p-10 md:p-12 rounded-chunky border-4 border-chocolate shadow-hard-chocolate space-y-8">
          <h2 className="text-3xl md:text-4xl font-display text-center text-chocolate">
            ✨ Your Link is Ready! ✨
          </h2>
          
          <div className="bg-cream p-6 rounded-chunky border-2 border-chocolate/20 break-all font-mono text-sm">
            {generatedUrl}
          </div>

          <p className="text-center text-chocolate/70 font-mono text-sm">
            📋 Message copied to clipboard!
          </p>

          <button
            onClick={handleReset}
            className="w-full bg-sanrio-lavender text-white font-display text-xl py-5 px-8 rounded-chunky border-4 border-chocolate shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            Make Another One 🎀
          </button>
        </div>
      ) : (
        // FORM STATE
        <div className="bg-white p-10 md:p-12 rounded-chunky border-4 border-chocolate shadow-hard-chocolate space-y-10">
          
          {/* Error */}
          {errorMessage && (
            <div className="p-6 bg-red-50 border-4 border-red-300 rounded-chunky">
              <p className="font-mono text-red-700 text-sm">⚠️ {errorMessage}</p>
            </div>
          )}

          {/* Recipient Name */}
          <div className="space-y-4">
            <label className="block font-display text-2xl text-chocolate">
              Who's the lucky one? 💝
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              maxLength={15}
              placeholder="Their name..."
              className="w-full px-6 py-5 font-mono border-4 border-chocolate rounded-chunky focus:outline-none focus:ring-4 focus:ring-sanrio-pink/50 bg-cream text-base"
            />
            <p className="text-sm font-mono text-chocolate/50 px-2">
              {recipientName.length}/15 characters
            </p>
          </div>

          {/* Anonymous Toggle */}
          <div className="bg-cream p-6 rounded-chunky border-2 border-chocolate/20">
            <label className="flex items-start gap-5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-6 h-6 mt-1 rounded border-2 border-chocolate flex-shrink-0"
              />
              <div className="space-y-2">
                <span className="font-display text-xl block text-chocolate">
                  🎭 Send Anonymously
                </span>
                <span className="font-mono text-sm text-chocolate/60 block">
                  Your identity will only be revealed if they say yes!
                </span>
              </div>
            </label>
          </div>

          {/* Creator Name */}
          <div className="space-y-4">
            <label className="block font-display text-2xl text-chocolate">
              What's your name? ✨
              {isAnonymous && (
                <span className="text-sm font-mono text-chocolate/60 block mt-3 font-normal">
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
              className="w-full px-6 py-5 font-mono border-4 border-chocolate rounded-chunky focus:outline-none focus:ring-4 focus:ring-sanrio-pink/50 bg-cream text-base"
            />
          </div>

          {/* Theme Selector */}
          <div className="space-y-4">
            <label className="block font-display text-2xl text-chocolate">
              Pick a vibe 🎨
            </label>
            <div className="grid grid-cols-3 gap-5">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-5 rounded-chunky border-4 transition-all ${
                    selectedTheme.id === theme.id
                      ? 'border-chocolate shadow-hard scale-105'
                      : 'border-chocolate/30 hover:border-chocolate/50'
                  }`}
                >
                  <div className={`w-full h-14 rounded-chunky ${theme.bgClass} mb-3 flex items-center justify-center text-2xl`}>
                    {theme.emoji}
                  </div>
                  <p className="font-mono text-sm text-chocolate">{theme.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <label className="block font-display text-2xl text-chocolate">
              Add your face (optional) 📸
            </label>

            {iconFile ? (
              <div className="flex items-center justify-between p-6 bg-cream rounded-chunky border-2 border-chocolate/20">
                <p className="font-mono text-sm text-chocolate/70">
                  ✅ Image uploaded
                </p>
                <button
                  onClick={() => {
                    setIconFile(null)
                    setIconPreview(null)
                  }}
                  className="font-mono text-sm text-red-600 hover:text-red-700 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="block w-full p-12 border-4 border-dashed border-chocolate/30 rounded-chunky cursor-pointer hover:border-chocolate/50 hover:bg-cream/50 transition-colors bg-cream">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="text-center space-y-3">
                  <p className="font-display text-5xl">📷</p>
                  <p className="font-mono text-chocolate/70 text-base">
                    Click to upload an image
                  </p>
                  <p className="font-mono text-chocolate/50 text-sm">
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
            className="w-full bg-sanrio-red text-white font-display text-2xl py-6 px-8 rounded-chunky border-4 border-chocolate shadow-hard-chocolate hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-3">
                <span className="animate-spin">⏳</span>
                Creating Magic...
              </span>
            ) : (
              'Generate My Link 🎀'
            )}
          </button>
        </div>
      )}

      {/* Background Image at Bottom */}
    </div>
  )
}