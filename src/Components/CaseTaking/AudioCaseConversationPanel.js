import React from 'react';

const AudioCaseConversationPanel = ({ messages = [], embedded = false }) => {
  if (!messages.length) {
    return (
      <div className={`ac-col-card ac-col-card--conversation${embedded ? ' is-embedded' : ''}`}>
        <div className="ac-col-card__header">
          <div className="ac-col-card__title">
            <span className="ac-col-card__title-icon" aria-hidden="true">
              <i className="ri-chat-3-line" />
            </span>
            Conversation
          </div>
        </div>
        <div className="ac-col-card__divider" />
        <div className="ac-col-card__body ac-conversation-empty">
          <i className="ri-chat-off-line" aria-hidden="true" />
          <p className="mb-0">No speaker turns detected.</p>
          <small className="text-muted">Check the transcript to review or edit the raw text.</small>
        </div>
      </div>
    );
  }

  return (
    <div className={`ac-col-card ac-col-card--conversation${embedded ? ' is-embedded' : ''}`}>
      <div className="ac-col-card__header">
        <div className="ac-col-card__title">
          <span className="ac-col-card__title-icon" aria-hidden="true">
            <i className="ri-chat-3-line" />
          </span>
          Conversation
        </div>
        <span className="ac-col-card__meta">
          {messages.length}
          {' '}
          turn
          {messages.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="ac-col-card__divider" />
      <div
        className="ac-col-card__body ac-whatsapp custom-scrollbar"
        role="log"
        aria-label="Doctor and patient conversation"
      >
        <div className="ac-whatsapp__date">Case conversation</div>
        {messages.map((message, index) => {
          const isDoctor = message.role === 'doctor';
          return (
            <div
              key={`audio-msg-${index}`}
              className={`ac-wa-row ${isDoctor ? 'ac-wa-row--doctor' : 'ac-wa-row--patient'}`}
            >
              {!isDoctor && (
                <span className="ac-wa-avatar ac-wa-avatar--patient" aria-hidden="true">P</span>
              )}
              <div className={`ac-wa-bubble ${isDoctor ? 'ac-wa-bubble--doctor' : 'ac-wa-bubble--patient'}`}>
                <div className="ac-wa-bubble__role">
                  {isDoctor ? 'Doctor' : 'Patient'}
                </div>
                <div className="ac-wa-bubble__text">{message.text}</div>
                {message.timestamp ? (
                  <div className="ac-wa-bubble__time">{message.timestamp}</div>
                ) : null}
              </div>
              {isDoctor && (
                <span className="ac-wa-avatar ac-wa-avatar--doctor" aria-hidden="true">D</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AudioCaseConversationPanel;
