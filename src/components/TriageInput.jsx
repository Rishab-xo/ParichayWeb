import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Paperclip } from 'lucide-react';
import '../styles/TriageInput.css';

const suggestions = [
    "I want to file a police complaint",
    "I don't want to reveal my identity",
    "My landlord changed the lock",
    "Someone touched me in public",
    "Employer is not paying my salary"
];

const TriageInput = () => {
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const navigate = useNavigate();

    const handleSuggestionClick = (text) => {
        // Navigate immediately to intake with the suggestion as the initial message
        navigate('/intake', { state: { message: text } });
    };

    const handleSend = () => {
        if (!inputText.trim()) return;
        navigate('/intake', { state: { message: inputText } });
    };

    return (
        <div className="triage-input-wrapper">
            <div className="input-box-container">
                <textarea
                    className="triage-textarea"
                    placeholder="Describe your issue in simple words... for example: My employer didn't pay my salary"
                    value={inputText}
                    onFocus={() => navigate('/intake')}
                    readOnly={true} // Prevent typing on landing page, just trigger navigation
                />

                <div className="input-actions">
                    <button className="action-btn file-btn" title="Attach file (Simulated)">
                        <Paperclip size={18} />
                        <span style={{ marginLeft: 6, fontSize: '0.85rem' }}>files</span>
                    </button>

                    <button
                        className={`action-btn send-btn ${inputText ? 'active' : ''}`}
                        onClick={handleSend}
                    >
                        <ArrowUp size={20} />
                    </button>
                </div>
            </div>

            <div className="suggestions-section">
                <p className="suggestions-label">Not sure how to begin? You can start like this:</p>
                <div className="chips-container">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            className="suggestion-chip"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TriageInput;
