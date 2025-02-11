export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;

  try {
    const response = await fetch(
      `https://api.0x.org/swap/v1/quote?${searchParams}`,
      {
        headers: {
          '0x-api-key': process.env.ZEROEX_API_KEY
        }
      }
    );
    
    const data = await response.json();
    return Response.json(data);
    
  } catch (error) {
    console.error('Quote API error:', error);
    return Response.json({ error: 'Failed to get quote' }, { status: 500 });
  }
} 