// Server-side only
export async function generateStaticParams() {
  return {
    paths: [
      { mode: 'retail' },
      { mode: 'advanced' }
    ],
    fallback: true
  };
} 