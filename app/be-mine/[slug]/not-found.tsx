export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-cream">
      <div className="text-center">
        <h1 className="text-6xl font-display text-chocolate mb-4">
          404 💔
        </h1>

        <p className="text-xl font-mono text-chocolate/70 mb-8">
          This link doesn't exist or has expired
        </p>

        <a
          href="/"
          className="inline-block bg-sanrio-red text-white font-display text-xl py-3 px-6 rounded-chunky border-4 border-chocolate shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          Make Your Own Link 
        </a>
      </div>
    </div>
  )
}