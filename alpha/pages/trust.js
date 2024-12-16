import { useState } from 'react'

export default function TrustScorePage() {
  const [messages, setMessages] = useState([
    { role: 'system', content: '' },
    { role: 'user', content: '' }
  ])
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleMessageChange = (index, field, value) => {
    const newMessages = [...messages]
    newMessages[index][field] = value
    setMessages(newMessages)
  }

  const addMessage = () => {
    setMessages([...messages, { role: 'user', content: '' }])
  }

  const removeMessage = (index) => {
    if (messages.length > 1) {
      const newMessages = messages.filter((_, i) => i !== index)
      setMessages(newMessages)
    }
  }

  const calculateTrust = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('https://plex.higherrrrrrr.fun/calculate-trust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.filter(m => m.content.trim() !== ''),
          output: output
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-mono text-[#2FE878] mb-12">
          Trust Score Calculator
        </h1>
        
        <div className="border border-[#2FE878]/20 rounded-lg p-6 mb-8">
          <h2 className="text-[#2FE878] text-xl font-mono mb-6">Messages</h2>
          
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className="flex gap-4 items-start">
                <select
                  value={msg.role}
                  onChange={(e) => handleMessageChange(index, 'role', e.target.value)}
                  className="bg-black border border-[#2FE878]/20 rounded px-3 py-2 w-32 text-[#2FE878] font-mono focus:border-[#2FE878] focus:outline-none"
                >
                  {index === 0 && <option value="system">System</option>}
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                </select>
                <div className="flex-1 relative">
                  <textarea
                    value={msg.content}
                    onChange={(e) => handleMessageChange(index, 'content', e.target.value)}
                    placeholder={`Enter ${msg.role} message...`}
                    className="w-full bg-black border border-[#2FE878]/20 rounded p-3 min-h-[100px] resize-y font-mono focus:border-[#2FE878] focus:outline-none"
                  />
                  {messages.length > 1 && (
                    <button 
                      onClick={() => removeMessage(index)}
                      className="absolute right-3 top-3 text-[#2FE878] hover:text-[#2FE878]/80 font-mono"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button 
              onClick={addMessage}
              className="w-full bg-black hover:bg-[#2FE878]/10 border border-[#2FE878]/20 text-[#2FE878] rounded py-2 transition-colors font-mono"
            >
              + Add Message
            </button>
          </div>
        </div>

        <div className="border border-[#2FE878]/20 rounded-lg p-6 mb-8">
          <h2 className="text-[#2FE878] text-xl font-mono mb-6">Output</h2>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="Enter the AI output the AI produced..."
            className="w-full bg-black border border-[#2FE878]/20 rounded p-3 min-h-[150px] resize-y font-mono focus:border-[#2FE878] focus:outline-none"
          />
        </div>

        <button 
          onClick={calculateTrust}
          disabled={loading || !output.trim()}
          className="w-full border border-[#2FE878] bg-[#2FE878]/10 hover:bg-[#2FE878]/20 text-[#2FE878] py-3 rounded-lg text-lg font-mono disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Calculating...' : 'Calculate Trust Score'}
        </button>

        {error && (
          <div className="mt-4 text-red-500 font-mono">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="mt-8 border border-[#2FE878]/20 rounded-lg p-6">
            <h2 className="text-xl font-mono text-[#2FE878] mb-6">Trust Score Results</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl font-mono text-[#2FE878]">
                {(result.trust_score * 100).toFixed(1)}%
              </div>
              <div className={`px-3 py-1 rounded font-mono ${
                result.trust_classification === 'HIGH' ? 'bg-[#2FE878]/10 text-[#2FE878]' :
                result.trust_classification === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {result.trust_classification}
              </div>
            </div>
            <p className="text-gray-400 mb-4 font-mono">{result.trust_description}</p>
            <div className="text-gray-500 font-mono">
              Perplexity: {result.perplexity.toFixed(2)}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}