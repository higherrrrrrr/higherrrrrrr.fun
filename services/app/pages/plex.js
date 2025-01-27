import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/Plex.module.css'

export default function TrustScorePage() {
  const router = useRouter()
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
  const [tweetId, setTweetId] = useState('')
  const [output, setOutput] = useState(
    'Bitcoin was introduced in a white paper titled "Bitcoin: A Peer-to-Peer Electronic Cash System," published on October 31, 2008...'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (router.query.tweetId) {
      loadTweetData(router.query.tweetId)
    }
  }, [router.query.tweetId])

  const loadTweetData = async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`https://api.higherrrrrrr.fun/api/jobs/tweet/get/${id}`)
      const data = await response.json()

      if (data.status !== 'success') {
        throw new Error('Failed to load tweet data')
      }

      setMessages(data.tweet.generation.messages)
      setOutput(data.tweet.text)
      setTweetId(id)
    } catch (err) {
      setError('Failed to load tweet data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

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

  const importFromTweet = () => {
    if (!tweetId.trim()) return
    
    router.push({
      pathname: router.pathname,
      query: { tweetId: tweetId.trim() }
    })
  }

  return (
    <div className={styles['plex-container']}>
      <main className={styles['plex-main']}>
        <div className={styles['header-section']}>
          <h1>Plex: Simple and Transparent AI Bot Verification</h1>
          <span className={styles['alpha-badge']}>ALPHA</span>
          <p className={styles['description']}>
            A lightweight tool for verifying the authenticity of AI-generated messages. 
            Plex analyzes statistical patterns to help distinguish genuine AI outputs from potentially manipulated ones.
          </p>
        </div>

        <div className={styles['important-section']}>
          <p className={styles['important-text']}>
            <span className={styles['important-highlight']}>Important:</span> For accurate results, 
            include the complete conversation context leading up to the output you want to verify, *including the system prompt*. 
            The system relies on the full context to properly analyze response patterns and determine authenticity.
          </p>
        </div>

        <div className={styles['links-section']}>
          <a 
            href="https://github.com/Thrive-Point-Group/plex"
            target="_blank"
            rel="noopener noreferrer"
            className={styles['link']}
          >
            <span className={styles['link-icon']}>📚</span>View on GitHub
          </a>
          <a 
            href="https://mirror.xyz/0xBA525e4c0d544eFc01af4382CA5a589b7e0656Ce/ijSvx1DGWBRW-yiVEkhkoB3jnrc4KkGRmMtNUi2izdU"
            target="_blank"
            rel="noopener noreferrer"
            className={styles['link']}
          >
            <span className={styles['link-icon']}>📖</span>Read about Building Trustworthy AI
          </a>
        </div>

        <div className={styles['import-section']}>
          <h2>Import from Tweet</h2>
          <div className={styles['import-input-section']}>
            <input
              type="text"
              value={tweetId}
              onChange={(e) => setTweetId(e.target.value)}
              placeholder="Enter Tweet ID..."
              className={styles['import-input']}
            />
            <button
              onClick={importFromTweet}
              className={styles['import-button']}
            >
              Import
            </button>
          </div>
          <p className={styles['import-description']}>
            Import conversation from Higherrrrrrr agents (coming when agents launch)
          </p>
        </div>

        <div className={styles['messages-section']}>
          <h2>Messages</h2>
          
          <div className={styles['messages-container']}>
            {messages.map((msg, index) => (
              <div key={index} className={styles['message-row']}>
                <select
                  value={msg.role}
                  onChange={(e) => handleMessageChange(index, 'role', e.target.value)}
                  className={styles['message-select']}
                >
                  {index === 0 && <option value="system">System</option>}
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                </select>
                <div className={styles['message-input-container']}>
                  <textarea
                    value={msg.content}
                    onChange={(e) => handleMessageChange(index, 'content', e.target.value)}
                    placeholder={`Enter ${msg.role} message...`}
                    className={styles['message-input']}
                  />
                  {messages.length > 1 && (
                    <button 
                      onClick={() => removeMessage(index)}
                      className={styles['remove-button']}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button 
              onClick={addMessage}
              className={styles['add-button']}
            >
              + Add Message
            </button>
          </div>
        </div>

        <div className={styles['output-section']}>
          <h2>Output</h2>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="Enter the AI output the AI produced..."
            className={styles['output-input']}
          />
        </div>

        <button 
          onClick={calculateTrust}
          disabled={loading || !output.trim()}
          className={styles['calculate-button']}
        >
          {loading ? 'Calculating...' : 'Calculate Trust Score'}
        </button>

        {error && (
          <div className={styles['error-section']}>
            <p className={styles['error-text']}>
              {error}
            </p>
            {error.includes('repetitive') && (
              <div className={styles['repetitive-section']}>
                <p>
                  Why did this happen? The trust score couldn't be calculated because the output shows unusual 
                  repetition patterns. This can occur when:
                </p>
                <ul className={styles['repetitive-list']}>
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
          <div className={styles['result-section']}>
            <h2>Trust Score Results</h2>
            <div className={styles['result-row']}>
              <div className={styles['result-score']}>
                {isFinite(result.trust_score) ? 
                  (result.trust_score * 100).toFixed(1) + '%' : 
                  'N/A'}
              </div>
              <div className={`${styles['result-badge']} ${
                result.trust_classification === 'HIGH' ? styles['high-badge'] :
                result.trust_classification === 'MEDIUM' ? styles['medium-badge'] :
                styles['low-badge']
              }`}>
                {result.trust_classification}
              </div>
            </div>
            <p className={styles['result-description']}>{result.trust_description}</p>
            <div className={styles['result-perplexity']}>
              Perplexity: {isFinite(result.perplexity) ? 
                result.perplexity.toFixed(2) : 
                'Unable to calculate'}
            </div>
            {result.using_default_key && (
              <div className={styles['result-note']}>
                Note: Using default API key (rate limited)
              </div>
            )}
            
            <div className={styles['result-understanding']}>
              <h3>Understanding the Score</h3>
              <p>
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