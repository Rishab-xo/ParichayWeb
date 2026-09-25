import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { sendTriageChat, getTriageSession } from '../utils/api';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, RotateCcw, Circle, CheckCircle, Copy, Check, Plus } from 'lucide-react';
import '../styles/ChatPage.css';

const LOCAL_STORAGE_KEY = 'refirm_active_triage';

const ChatPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { getToken } = useAuth();

    // 1. Initialize state from LocalStorage if available (to survive page reload)
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.messages || [];
            }
        } catch (e) {
            console.warn("Could not parse saved chat from localStorage", e);
        }
        return [];
    });

    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [copiedSession, setCopiedSession] = useState(false);
    const [sessionId, setSessionId] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.sessionId || null;
            }
        } catch {}
        return null;
    });

    const [issueCategory, setIssueCategory] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) return JSON.parse(saved).issueCategory || 'Evaluating...';
        } catch {}
        return 'Evaluating...';
    });

    const [isEmergency, setIsEmergency] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) return Boolean(JSON.parse(saved).isEmergency);
        } catch {}
        return false;
    });

    const [extractedFacts, setExtractedFacts] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) return JSON.parse(saved).extractedFacts || [];
        } catch {}
        return [];
    });

    const [status, setStatus] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) return JSON.parse(saved).status || 'IN_PROGRESS';
        } catch {}
        return 'IN_PROGRESS';
    });

    // Fact checklist state
    const [factChecklist, setFactChecklist] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) return JSON.parse(saved).factChecklist || null;
        } catch {}
        return null;
    });

    const [errorBanner, setErrorBanner] = useState(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const hasInitializedFromState = useRef(false);

    const isReadyForDrafting = status === 'READY_FOR_DRAFTING';

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
    };

    // 2. Persist state to LocalStorage on every state update
    useEffect(() => {
        if (sessionId || messages.length > 0) {
            const stateToSave = {
                sessionId,
                messages,
                issueCategory,
                isEmergency,
                extractedFacts,
                status,
                factChecklist
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        }
    }, [sessionId, messages, issueCategory, isEmergency, extractedFacts, status, factChecklist]);

    // 3. Re-sync with PostgreSQL database on reload if active sessionId exists
    useEffect(() => {
        const syncSessionWithBackend = async () => {
            if (!sessionId || location.state?.message) return;
            try {
                let token = null;
                try { token = await getToken(); } catch {}

                const backendSession = await getTriageSession(sessionId, token);
                if (backendSession) {
                    if (backendSession.issueCategory) {
                        setIssueCategory(backendSession.issueCategory);
                    }
                    if (backendSession.status) {
                        setStatus(backendSession.status);
                    } else if (backendSession.isComplete || backendSession.complete) {
                        setStatus('READY_FOR_DRAFTING');
                    }
                    if (backendSession.isEmergency !== undefined) {
                        setIsEmergency(Boolean(backendSession.isEmergency));
                    }

                    // If local messages are empty or out of sync, reconstruct from backend chatHistory
                    if (backendSession.chatHistory && backendSession.chatHistory.length > 0) {
                        const reconstructed = backendSession.chatHistory.map((turn, index) => ({
                            id: index + 1,
                            sender: turn.role === 'USER' ? 'user' : 'bot',
                            text: turn.message
                        }));
                        setMessages(reconstructed);
                    }
                }
            } catch (syncErr) {
                console.warn("Could not sync session with backend on reload:", syncErr.message);
            }
        };

        syncSessionWithBackend();
    }, [sessionId]);

    // 4. Start New Chat / Reset
    const handleResetChat = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setSessionId(null);
        setMessages([]);
        setIssueCategory('Evaluating...');
        setIsEmergency(false);
        setExtractedFacts([]);
        setStatus('IN_PROGRESS');
        setErrorBanner(null);
        setInputText('');
        setFactChecklist(null);
    };

    // 5. Multi-turn chat message dispatcher with Spring AI backend
    const processMessage = async (textToSend, activeSessionId = sessionId) => {
        setIsTyping(true);
        setErrorBanner(null);
        try {
            let token = null;
            try { token = await getToken(); } catch {}

            // Call Spring AI backend multi-turn triage endpoint (/triage/chat)
            const triageResponse = await sendTriageChat(textToSend, activeSessionId, token);

            if (triageResponse) {
                if (triageResponse.sessionId) {
                    setSessionId(triageResponse.sessionId);
                }
                if (triageResponse.issueCategory) {
                    setIssueCategory(triageResponse.issueCategory);
                }
                if (triageResponse.isEmergency !== undefined || triageResponse.emergency !== undefined) {
                    setIsEmergency(Boolean(triageResponse.isEmergency || triageResponse.emergency));
                }
                if (triageResponse.extractedFacts && Array.isArray(triageResponse.extractedFacts)) {
                    setExtractedFacts(triageResponse.extractedFacts);
                }
                if (triageResponse.status) {
                    setStatus(triageResponse.status);
                } else if (triageResponse.isComplete || triageResponse.complete) {
                    setStatus('READY_FOR_DRAFTING');
                }

                // Update fact checklist from AI response
                if (triageResponse.factChecklist) {
                    setFactChecklist(triageResponse.factChecklist);
                }

                const botReply = triageResponse.reply || triageResponse.nextQuestion;

                if (botReply) {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        sender: 'bot',
                        text: botReply,
                        isComplete: triageResponse.status === 'READY_FOR_DRAFTING' || triageResponse.isComplete
                    }]);
                }
            }

        } catch (error) {
            console.error("Triage API call error:", error);
            setErrorBanner(`Backend connection error: ${error.message || 'Failed to communicate with Spring AI'}`);
        } finally {
            setIsTyping(false);
        }
    };

    // Auto-process new incoming message from Landing Page chips / input
    useEffect(() => {
        if (!hasInitializedFromState.current && location.state?.message) {
            hasInitializedFromState.current = true;
            handleResetChat(); // Clear old session for a fresh issue
            const userMsgText = location.state.message;
            setMessages([
                {
                    id: Date.now(),
                    sender: 'user',
                    text: userMsgText
                }
            ]);
            processMessage(userMsgText, null);
        }
    }, [location.state]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const currentInput = inputText.trim();
        const newUserMessage = {
            id: Date.now(),
            sender: 'user',
            text: currentInput
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputText('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        await processMessage(currentInput, sessionId);
    };

    const handleGenerateDraft = () => {
        const fullConversation = messages
            .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
            .join('\n\n');

        const factsPayload = extractedFacts.length > 0
            ? extractedFacts.join('\n')
            : fullConversation;

        navigate('/document-flow', {
            state: {
                docType: issueCategory !== 'Evaluating...' ? `${formatHumanText(issueCategory)} Brief` : 'Legal Brief',
                facts: factsPayload,
                domain: issueCategory !== 'Evaluating...' ? formatHumanText(issueCategory) : 'General Legal',
                sessionId: sessionId,
                autoGenerate: true
            }
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCopySession = () => {
        if (sessionId) {
            navigator.clipboard.writeText(sessionId);
            setCopiedSession(true);
            setTimeout(() => setCopiedSession(false), 2000);
        }
    };

    // Helper: format enum or snake_case to Human Readable Title
    const formatHumanText = (str) => {
        if (!str || str === 'Evaluating...') return 'Evaluating...';
        return str
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    // Compute coverage for display
    const coveragePercent = factChecklist?.coveragePercent ?? (isReadyForDrafting ? 100 : 0);
    const gatheredFacts = factChecklist?.gatheredFacts ?? {};
    const missingFacts = factChecklist?.missingRequiredFacts ?? [];
    const gatheredKeys = Object.keys(gatheredFacts);
    const totalRequiredFacts = gatheredKeys.length + missingFacts.length;
    const hasChecklist = totalRequiredFacts > 0;

    return (
        <div className="chat-layout">
            {/* Left Sidebar */}
            <aside className="chat-sidebar">
                {/* Header with Navigation & New Case CTA */}
                <div className="sidebar-top">
                    <button 
                        onClick={() => navigate('/')} 
                        className="sidebar-home-link"
                        title="Back to Parichay Home"
                    >
                        <span>Parichay</span>
                    </button>
                    <button 
                        onClick={handleResetChat}
                        title="Start a fresh legal intake session"
                        className="new-case-primary-btn"
                    >
                        <Plus size={16} />
                        <span>New Case</span>
                    </button>
                </div>

                {/* Fact Coverage Progress Section */}
                <div className="sidebar-section fact-checklist-section">
                    <div className="sidebar-section-header">
                        <div className="checklist-title-wrap">
                            <h3>Fact Checklist</h3>
                            {issueCategory !== 'Evaluating...' && (
                                <span className="checklist-category-tag">{formatHumanText(issueCategory)}</span>
                            )}
                        </div>
                        <span className={`coverage-badge ${coveragePercent >= 80 ? 'coverage-badge-done' : ''}`}>
                            {coveragePercent}%
                        </span>
                    </div>

                    <div className="sidebar-card fact-coverage-card">
                        {/* Progress Bar */}
                        <div className="coverage-bar-container">
                            <div className="coverage-bar-track">
                                <div 
                                    className={`coverage-bar-fill ${coveragePercent >= 80 ? 'coverage-ready' : coveragePercent >= 50 ? 'coverage-mid' : 'coverage-low'}`}
                                    style={{ width: `${Math.min(coveragePercent, 100)}%` }}
                                />
                            </div>
                        </div>
                        
                        {/* Fact Checklist Items */}
                        <div className="fact-checklist-items">
                            {!hasChecklist ? (
                                <div className="checklist-empty-hint">
                                    Describe your case to start capturing facts automatically.
                                </div>
                            ) : (
                                <>
                                    {gatheredKeys.map(key => (
                                        <div key={key} className="fact-item fact-gathered">
                                            <CheckCircle size={14} className="fact-icon-done" />
                                            <div className="fact-item-content">
                                                <div className="fact-item-title">{formatHumanText(key)}</div>
                                                {gatheredFacts[key] && (
                                                    <div className="fact-item-value" title={gatheredFacts[key]}>
                                                        {gatheredFacts[key]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {missingFacts.map(key => (
                                        <div key={key} className="fact-item fact-missing">
                                            <Circle size={14} className="fact-icon-missing" />
                                            <div className="fact-item-content">
                                                <div className="fact-item-title">{formatHumanText(key)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {missingFacts.length > 0 && (
                            <div className="coverage-hint">
                                {missingFacts.length} more {missingFacts.length === 1 ? 'detail' : 'details'} required
                            </div>
                        )}
                    </div>
                </div>

                {/* Next Actions */}
                <div className="sidebar-section next-actions-section">
                    <h3>Next Actions</h3>
                    <div 
                        className={`action-card ${isReadyForDrafting ? 'action-card-ready' : 'action-card-disabled'}`}
                        onClick={isReadyForDrafting ? handleGenerateDraft : undefined}
                    >
                        <span className="icon">📄</span>
                        <div className="action-info">
                            <h4>Generate Document</h4>
                            <p>{isReadyForDrafting ? 'Draft ready to generate' : 'Complete intake first'}</p>
                        </div>
                    </div>
                    <div className="action-card" onClick={() => navigate('/find-lawyer')}>
                        <span className="icon">⚖️</span>
                        <div className="action-info">
                            <h4>Consult Lawyer</h4>
                            <p>Connect with an advocate</p>
                        </div>
                    </div>
                </div>

                {sessionId && (
                    <div className="sidebar-footer-session">
                        <button 
                            className="session-id-btn" 
                            onClick={handleCopySession}
                            title="Copy Case Session ID"
                        >
                            {copiedSession ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                            <span>Case #{sessionId.substring(0, 8)}</span>
                        </button>
                    </div>
                )}
            </aside>

            {/* Main Chat Area */}
            <main className="chat-main">
                <div className="messages-container" ref={messagesContainerRef}>
                    <div className="messages-wrapper">
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                                <h3 style={{ fontSize: '1.2rem', color: '#111827', marginBottom: '8px' }}>
                                    Welcome to Refirm AI Legal Intake
                                </h3>
                                <p style={{ fontSize: '0.9rem' }}>
                                    Type your case details or describe what happened below to begin real-time legal triage.
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={`message-row ${msg.sender}`}>
                                <div className="message-bubble">
                                    {msg.sender === 'bot' && <div className="bot-avatar">P</div>}
                                    <div className="message-text">
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="message-row bot">
                                <div className="message-bubble typing">
                                    <div className="bot-avatar">P</div>
                                    <div className="typing-dots"><span>.</span><span>.</span><span>.</span></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Error Banner */}
                {errorBanner && (
                    <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #f87171',
                        color: '#991b1b',
                        padding: '10px 16px',
                        margin: '0 24px 12px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <AlertCircle size={16} />
                        <span>{errorBanner}</span>
                    </div>
                )}

                {/* Bottom Input Area with Docked Sleek Completion Card when Ready */}
                <div className="input-container">
                    {/* Compact, Sleek Completion Banner above the input bar */}
                    {isReadyForDrafting && (
                        <div className="completion-docked-card fade-in">
                            <div className="completion-card-left">
                                <div className="completion-icon-wrap">
                                    <CheckCircle2 size={18} />
                                </div>
                                <div className="completion-text-wrap">
                                    <span className="completion-main-text">Intake Complete</span>
                                    <span className="completion-sub-text">100% facts captured · Ready to generate brief</span>
                                </div>
                            </div>
                            <button
                                className="completion-btn"
                                onClick={handleGenerateDraft}
                            >
                                <Sparkles size={15} />
                                <span>Generate Brief</span>
                                <ArrowRight size={15} />
                            </button>
                        </div>
                    )}

                    <div className="input-wrapper">
                        <textarea
                            ref={textareaRef}
                            className="chat-input"
                            placeholder={isReadyForDrafting ? "Ask follow-up questions or clarify facts..." : "Type your case details or answer..."}
                            value={inputText}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <button
                            className="send-icon-btn"
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                        >
                            ➤
                        </button>
                    </div>
                    <div className="disclaimer">
                        🔒 Encrypted session · Refirm AI structures case facts in real-time
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ChatPage;