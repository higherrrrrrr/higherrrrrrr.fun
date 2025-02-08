// pages/api/chat.js
import OpenAI from 'openai';
import { getKnowledgeBase } from '../../../utils/knowledgeBase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { conversation } = await request.json();
    
    // Get the latest knowledge base
    const knowledgeBase = await getKnowledgeBase();

    const messages = conversation.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Add system message with knowledge base
    messages.unshift({
      role: 'system',
      content: `You are a helpful support agent for Higherrrrrrr, a meme token trading platform on Solana. 
      Be friendly, knowledgeable, and a bit playful - but always professional and accurate. 
      If the user really cant get to an answer, direct them to our community telegram please! 
      But try really really hard to get them to an answer first.
      
      Here is the current documentation and knowledge base to reference:
      
      ${knowledgeBase}`
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return Response.json({ 
      response: completion.choices[0].message.content 
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return Response.json({ 
      error: "Sorry, I'm having trouble connecting right now. Please try again later." 
    }, { status: 500 });
  }
}
