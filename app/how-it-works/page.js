import { Suspense } from 'react'

function HowItWorksContent() {
  const searchParams = useSearchParams()
  // ... rest of your component
}

export default function HowItWorks() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HowItWorksContent />
    </Suspense>
  )
} 