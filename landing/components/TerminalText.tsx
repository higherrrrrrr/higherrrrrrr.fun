// components/TerminalText.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface Message {
    text: string;
    pauseAfter?: number;
    isLast?: boolean;
    html?: boolean;
}

interface TerminalTextProps {
    messages: Message[];
    typingSpeed?: number;
}

const TerminalText: React.FC<TerminalTextProps> = ({
                                                       messages,
                                                       typingSpeed = 50,
                                                   }) => {
    const [displayText, setDisplayText] = useState('');
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [pauseState, setPauseState] = useState({ isPaused: false, duration: 0 });
    const [showLoading, setShowLoading] = useState(true);
    const terminalRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Parse and handle pause tags in the text
    const processText = useCallback((text: string) => {
        const pauseRegex = /<pause\s+(\d+)>/g;
        let match;
        let lastIndex = 0;
        const segments = [];

        while ((match = pauseRegex.exec(text)) !== null) {
            // Add the text before the pause tag
            if (match.index > lastIndex) {
                segments.push({
                    type: 'text',
                    content: text.slice(lastIndex, match.index),
                });
            }

            // Add the pause
            segments.push({
                type: 'pause',
                duration: parseInt(match[1]) * 1000, // Convert to milliseconds
            });

            lastIndex = match.index + match[0].length;
        }

        // Add any remaining text
        if (lastIndex < text.length) {
            segments.push({
                type: 'text',
                content: text.slice(lastIndex),
            });
        }

        return segments;
    }, []);

    const scrollToBottom = useCallback(() => {
        if (terminalRef.current && window.innerWidth <= 768) { // Only scroll on mobile
            const scrollHeight = terminalRef.current.scrollHeight;
            window.scrollTo({
                top: scrollHeight,
                behavior: 'smooth'
            });
        }
    }, []);

    useEffect(() => {
        if (showLoading) {
            const loadingTimeout = setTimeout(() => {
                setShowLoading(false);
            }, 4000); // 4 seconds loading time
            return () => clearTimeout(loadingTimeout);
        }
    }, [showLoading]);

    // Handle pause timing
    useEffect(() => {
        if (pauseState.isPaused) {
            const timeout = setTimeout(() => {
                setPauseState({ isPaused: false, duration: 0 });
            }, pauseState.duration);
            return () => clearTimeout(timeout);
        }
    }, [pauseState]);

    // Main typing effect
    useEffect(() => {
        if (showLoading) return;

        if (currentMessageIndex >= messages.length || showLoading || pauseState.isPaused) return;

        const currentMessage = messages[currentMessageIndex];
        const segments = processText(currentMessage.text);
        const cleanText = currentMessage.text.replace(/<pause\s+\d+>/g, '');

        // Calculate pause positions
        let pausePositions: { position: number; duration: number }[] = [];
        let currentPosition = 0;

        segments.forEach((segment) => {
            if (segment.type === 'text') {
                currentPosition += segment.content.length;
            } else if (segment.type === 'pause') {
                pausePositions.push({
                    position: currentPosition,
                    duration: segment.duration,
                });
            }
        });

        // Check if we've reached the end of the message
        if (currentCharIndex >= cleanText.length) {
            if (currentMessage.isLast) return;

            typingTimeoutRef.current = setTimeout(() => {
                setCurrentMessageIndex((prev) => prev + 1);
                setCurrentCharIndex(0);
                setDisplayText((prev) => prev + '\n\n');
                scrollToBottom();
            }, currentMessage.pauseAfter || 1000);

            return () => {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
            };
        } else {
            typingTimeoutRef.current = setTimeout(() => {
                // Output the character at currentCharIndex
                setDisplayText((prevDisplayText) => {
                    const newText = prevDisplayText + cleanText[currentCharIndex];
                    setTimeout(scrollToBottom, 0);
                    return newText;
                });

                // Increment currentCharIndex
                setCurrentCharIndex((prevIndex) => {
                    const nextIndex = prevIndex + 1;

                    // Check if we need to pause at the next character index
                    const pausePoint = pausePositions.find((p) => p.position === nextIndex);
                    if (pausePoint) {
                        setPauseState({ isPaused: true, duration: pausePoint.duration });
                    }

                    return nextIndex;
                });
            }, typingSpeed);

            return () => {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
            };
        }
    }, [
        currentMessageIndex,
        currentCharIndex,
        messages,
        typingSpeed,
        showLoading,
        processText,
        pauseState.isPaused,
        scrollToBottom,
    ]);

    if (showLoading) {
        return (
            <div className="terminal" ref={terminalRef}>
                <pre className="terminal-text">
                    Loading...
                    <span className="terminal-cursor" />
                </pre>
            </div>
        );
    }

    const createMarkup = () => {
        if (currentMessageIndex === messages.length - 1 && messages[currentMessageIndex].html) {
            const text = displayText;
            const linkText = "pledge your allegiance";
            const index = text.lastIndexOf(linkText);

            if (index !== -1) {
                const before = text.substring(0, index);
                const after = text.substring(index + linkText.length);
                return (
                    <>
                        {before}
                        <Link href="/pledge" className="text-green-500 hover:text-green-400 underline">
                            {linkText}
                        </Link>
                        {after}
                    </>
                );
            }
        }
        return displayText;
    };

    return (
        <div className="terminal" ref={terminalRef}>
            <pre className="terminal-text">
                {messages[currentMessageIndex]?.html ? createMarkup() : displayText}
                <span className="terminal-cursor" />
            </pre>
        </div>
    );
};

export default TerminalText;