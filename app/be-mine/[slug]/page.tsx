import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import LandingPage from '@/components/LandingPage'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function BeMinePage({ params }: PageProps) {
  const { slug } = await params
   
  const { data: link, error } = await supabase
    .from('links')
    .select('*')
    .eq('slug', slug)
    .single()
 
  if (error || !link) {
    notFound()
  }
 
  return <LandingPage link={link} />
}