import React from 'react';
import { FileText, Scale, BookOpen, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import '../styles/WhatIsNextCards.css';

export const WhatIsNextCards = ({ cards, onAction }) => {
  if (!cards || cards.length === 0) return null;

  const renderIcon = (type) => {
    switch (type) {
      case 'DRAFT':
        return <FileText size={16} className="text-indigo-600" />;
      case 'ARGS':
        return <Scale size={16} className="text-amber-600" />;
      case 'BOOK_RESEARCH':
        return <BookOpen size={16} className="text-emerald-600" />;
      default:
        return <MessageSquare size={16} className="text-purple-600" />;
    }
  };

  return (
    <div className="what-is-next-container">
      <div className="what-next-label">
        <Sparkles size={13} className="text-amber-500" />
        <span>What's next? (Lawyer Action Directives)</span>
      </div>

      <div className="next-cards-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className="next-card-item"
            onClick={() => onAction && onAction(card)}
          >
            <div className="card-top">
              <div className="card-icon-wrap">{renderIcon(card.iconType)}</div>
              {card.creditCostBadge && (
                <span className="card-credit-pill">{card.creditCostBadge}</span>
              )}
            </div>

            <span className="card-main-label">{card.label}</span>

            <div className="card-bottom-action">
              <span>Proceed</span>
              <ArrowRight size={13} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhatIsNextCards;
