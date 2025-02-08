// pages/api/chat.js
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { conversation } = req.body;
  if (!conversation || !Array.isArray(conversation)) {
    res.status(400).json({ error: "Invalid conversation format" });
    return;
  }

  // Build the messages array expected by OpenAI
  // You might transform your conversation into the format:
  // [{ role: "system", content: "You are helpful support." }, { role: "user", content: "..." }]
  const messages = [
    { role: "system", content: "You are a helpful support chatbot." },
    ...conversation.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }))
  ];

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini", // or whichever model you want to use
      messages: messages,
      temperature: 0.7,
    });
    const reply = completion.data.choices[0].message.content.trim();
    res.status(200).json({ response: reply });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: "Failed to get response from OpenAI" });
  }
}
