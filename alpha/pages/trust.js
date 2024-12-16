import { useState } from 'react'

export default function TrustScorePage() {
  const [messages, setMessages] = useState([
    { 
      role: 'system', 
      content: 'You are a cryptocurrency expert' 
    },
    { 
      role: 'user', 
      content: 'Who was the creator of Bitcoin?' 
    }
  ])
  const [output, setOutput] = useState(
    'Bitcoin was introduced in a white paper titled "Bitcoin: A Peer-to-Peer Electronic Cash System," published on October 31, 2008. The author of this paper used the pseudonym "Satoshi Nakamoto." Despite extensive research and speculation, the true identity behind this name remains unknown. Over the years, various individuals have been proposed as Satoshi Nakamoto—some by investigators, some through their own claims—but conclusive proof has never been provided to the satisfaction of the broader community or independent experts.\n\n' +
    'Satoshi Nakamoto, under this pseudonym, released the first version of the Bitcoin software in January 2009. He continued to contribute to the project\'s development and communicate through emails and online forums until around 2010. After that time, his direct involvement ceased, and control of the code repository and project leadership passed to other contributors. Since then, the Bitcoin community and its ecosystem have grown substantially, but the mystery of Satoshi Nakamoto\'s true identity endures.'
  )
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
    setResult(null)
    
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

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(data.wait_seconds)} seconds.`)
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (!isFinite(data.perplexity)) {
        throw new Error('Unable to calculate trust score. The output may be too repetitive or invalid.')
      }

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
        <div className="mb-12 space-y-6">
          <div>
            <div className="mb-4">
              <h1 className="text-4xl font-mono text-[#2FE878] mb-2">
                Plex: Simple and Transparent AI Bot Verification
              </h1>
              <span className="inline-block px-4 py-1.5 bg-[#2FE878]/10 border border-[#2FE878] text-[#2FE878] text-base font-mono rounded-md">
                ALPHA
              </span>
            </div>
            <p className="text-[#2FE878] leading-relaxed opacity-80">
              A lightweight tool for verifying the authenticity of AI-generated messages. 
              Plex analyzes statistical patterns to help distinguish genuine AI outputs from potentially manipulated ones.
            </p>
          </div>

          <div className="border-l-2 border-[#2FE878]/20 pl-4">
            <p className="text-[#2FE878] text-sm leading-relaxed opacity-80">
              <span className="text-[#2FE878] opacity-100 font-bold">Important:</span> For accurate results, 
              include the complete conversation context leading up to the output you want to verify, *including the system prompt*. 
              The system relies on the full context to properly analyze response patterns and determine authenticity.
            </p>
          </div>

          <div className="flex gap-4">
            <a 
              href="https://github.com/Thrive-Point-Group/plex"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#2FE878] hover:text-[#2FE878]/80 transition-colors"
            >
              <span className="mr-2">📚</span>View on GitHub
            </a>
            <a 
              href="https://mirror.xyz/0xBA525e4c0d544eFc01af4382CA5a589b7e0656Ce/ijSvx1DGWBRW-yiVEkhkoB3jnrc4KkGRmMtNUi2izdU"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#2FE878] hover:text-[#2FE878]/80 transition-colors"
            >
              <span className="mr-2">📖</span>Read about Building Trustworthy AI
            </a>
          </div>
        </div>
        
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
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-3">
            <p className="text-red-500 font-mono">
              {error}
            </p>
            {error.includes('repetitive') && (
              <div className="text-gray-400 text-sm space-y-2">
                <p>
                  Why did this happen? The trust score couldn't be calculated because the output shows unusual 
                  repetition patterns. This can occur when:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>The text contains many repeated phrases or sequences</li>
                  <li>The output was potentially manipulated or corrupted</li>
                  <li>The response shows patterns inconsistent with typical AI language models</li>
                </ul>
                <p>
                  Try analyzing a different section of the output or verify if the text was accurately copied.
                </p>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="mt-8 border border-[#2FE878]/20 rounded-lg p-6">
            <h2 className="text-xl font-mono text-[#2FE878] mb-6">Trust Score Results</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl font-mono text-[#2FE878]">
                {isFinite(result.trust_score) ? 
                  (result.trust_score * 100).toFixed(1) + '%' : 
                  'N/A'}
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
              Perplexity: {isFinite(result.perplexity) ? 
                result.perplexity.toFixed(2) : 
                'Unable to calculate'}
            </div>
            {result.using_default_key && (
              <div className="mt-4 text-yellow-500/80 text-sm font-mono">
                Note: Using default API key (rate limited)
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-[#2FE878]/20">
              <h3 className="text-[#2FE878] text-sm font-mono mb-3">Understanding the Score</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                The trust score is calculated by analyzing the statistical patterns in the AI's output. 
                A high perplexity (above 100) suggests unusual patterns, while lower values indicate more 
                natural, model-consistent responses. The score considers factors like token probability 
                and sequence coherence.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}