# Ribbon 

Create a link. Send it. Watch them say yes.

![img1.jpg]

---

## Design Philosophy:  

Ribbon embraces opinionated maximalism,early 2000s internet aesthetics meets modern glassmorphism. Bold gradients, chunky borders, playful animations, and that signature aero glass blur that makes everything feel tactile and alive.

It's a digital page wrapped in nostalgic Y2K vibes. 

---

## Roadblocks I hit while buidling this

### 1. Client-Side Image Resizing Before Upload
Instead of sending massive 5MB photos to the server, I resize them to 400×400px before uploading using Canvas API. This saves bandwidth, speeds up uploads, and keeps the UI snappy. Plus, I auto-crop to a perfect square so every image looks polished — no weird stretching or broken layouts.

```javascript
const resizeImage = (file: File): Promise<Blob> => {
  // Canvas magic: crop to square, resize to 400x400, convert to JPEG
  // Bandwidth saved: ~80% on average
}
```

### 2. Aero Glass Glassmorphism with Cross-Browser Consistency
Getting that Windows Vista-inspired aero glass effect to look identical across Chrome, Safari, and Firefox was a challenge. I used layered `backdrop-filter` with custom opacity and brightness adjustments to compensate for browser rendering differences. The result? Dreamy, frosted glass that actually works everywhere.

```css
.aero-glass {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px) saturate(180%) brightness(1.1);
  /* Chrome needs brightness boost, Safari doesn't — this balances both */
}
```  
---

![img2.jpg]

---

## What I Learned

- Glassmorphism is hard. Making it work across browsers took way more tweaking than expected.
- Image optimization matters. Client-side resizing cut upload times by 80%.
- Body background tricks. Sometimes you need to break out of component boundaries to get pixel-perfect design.
- Fun design > perfect design. The playful animations and nostalgic vibes make this project *feel* special, not just look pretty.

---

## Tech Stack  

- Frontend: Next.js 14  
- Animations: CSS-only magic  
- Database: Supabase  
- Styling: Tailwind CSS  

### Database Schema  
```sql
links {
  id: UUID
  slug: ShortID (e.g., site.com/be-mine/abc123)
  recipient_name: String
  creator_name: String
  theme_id: Integer
  image_url: String (Supabase Storage)
  is_anonymous: Boolean
  response: String
  responded_at: Timestamp
}
```

## Why This Project Matters

Because asking someone out is scary. But it's also exciting, hopeful, and kinda magical.  

---

Built with way too much CSS

![img3.jpg]