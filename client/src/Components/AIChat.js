import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { IoMdSend } from "react-icons/io";
import { BsRobot } from "react-icons/bs";
import { MdOutlineArrowBackIos } from "react-icons/md";
import moment from "moment";
import {
  getAIChatSession,
  sendAIMessage,
} from "../Redux/Reducer/AI/ai.action";
import Spinner from "../Styles/Spinner";

const AIChat = ({ onClose }) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messageEndRef = useRef(null);

  const aiState = useSelector((state) => state.ai);
  const loggedUser = useSelector((state) => state.user.userDetails);

  const SERVER_ACCESS_BASE_URL =
    process.env.REACT_APP_SERVER_ACCESS_BASE_URL;

  // Load AI chat session and existing messages on mount
  useEffect(() => {
    dispatch(getAIChatSession());
  }, [dispatch]);

  // Load existing messages when chat session is available
  useEffect(() => {
    if (aiState.chatSession?._id) {
      loadMessages(aiState.chatSession._id);
    }
    // eslint-disable-next-line
  }, [aiState.chatSession?._id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiState.isLoading]);

  const loadMessages = async (chatId) => {
    try {
      const token = JSON.parse(localStorage.getItem("ETalkUser"))?.token;
      const res = await fetch(
        `${SERVER_ACCESS_BASE_URL}/api/message/${chatId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load AI messages");
    }
  };

  const handleSend = async () => {
    if (!message.trim() || aiState.isLoading) return;

    const msgText = message;
    setMessage("");

    // Optimistic add user message
    const tempUserMsg = {
      _id: "temp_" + Date.now(),
      sender: { _id: loggedUser._id, name: loggedUser.name, pic: loggedUser.pic },
      content: msgText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const result = await dispatch(
      sendAIMessage(msgText, aiState.chatSession?._id)
    );

    // Reload all messages from DB to get clean state
    if (aiState.chatSession?._id) {
      await loadMessages(aiState.chatSession._id);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isAIMessage = (msg) => {
    return msg.sender?.email === "ai-bot@e-talk.internal" || 
           msg.sender?.name === "Quick Chat AI";
  };

  return (
    <Wrapper>
      {/* Header */}
      <div className="ai-chat-header">
        <div className="flex items-center">
          <button className="back-btn mr-3" onClick={onClose}>
            <MdOutlineArrowBackIos />
          </button>
          <div className="flex items-center">
            <div className="ai-avatar">
              <BsRobot className="robot-icon" />
            </div>
            <div className="ml-3">
              <h6 className="mb-0 font-semibold">Quick Chat AI</h6>
              <small className="text-green-500">Always Online</small>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-chat-messages">
        {messages.length === 0 && !aiState.isLoading && (
          <div className="empty-state">
            <BsRobot className="empty-icon" />
            <h3>Hi! I'm Quick Chat AI</h3>
            <p>Ask me anything — I can help with questions, brainstorming, writing, and more.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg._id || index}
            className={`message-bubble ${
              isAIMessage(msg) ? "ai-message" : "user-message"
            }`}
          >
            <div className="bubble-content">
              <p className="message-text">{msg.content}</p>
              <span className="message-time">
                {moment(msg.createdAt).format("h:mm A")}
              </span>
            </div>
          </div>
        ))}

        {aiState.isLoading && (
          <div className="message-bubble ai-message">
            <div className="bubble-content typing">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>

      {/* Input */}
      <div className="ai-chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask AI anything..."
          disabled={aiState.isLoading}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!message.trim() || aiState.isLoading}
        >
          <IoMdSend />
        </button>
      </div>
    </Wrapper>
  );
};

export default AIChat;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.bg.primary};

  .ai-chat-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);
    background-color: ${({ theme }) => theme.colors.bg.primary};

    .back-btn {
      display: none;
      color: ${({ theme }) => theme.colors.heading};
      font-size: 1.2rem;
      cursor: pointer;
    }

    .ai-avatar {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;

      .robot-icon {
        color: white;
        font-size: 1.4rem;
      }
    }

    h6 {
      color: ${({ theme }) => theme.colors.heading};
    }
  }

  .ai-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: ${({ theme }) => theme.colors.heading};
      opacity: 0.7;

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        color: ${({ theme }) => theme.colors.primaryRgb};
      }

      h3 {
        margin-bottom: 0.5rem;
      }

      p {
        max-width: 300px;
        font-size: 0.9rem;
      }
    }

    .message-bubble {
      display: flex;
      max-width: 75%;

      &.user-message {
        align-self: flex-end;

        .bubble-content {
          background-color: rgba(${({ theme }) => theme.colors.rgb.primary}, 0.15);
          border-radius: 16px 16px 4px 16px;
        }
      }

      &.ai-message {
        align-self: flex-start;

        .bubble-content {
          background-color: ${({ theme }) => theme.colors.bg.secondary};
          border-radius: 16px 16px 16px 4px;
        }
      }

      .bubble-content {
        padding: 0.75rem 1rem;

        .message-text {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.5;
          color: ${({ theme }) => theme.colors.heading};
          white-space: pre-wrap;
          word-break: break-word;
        }

        .message-time {
          font-size: 0.7rem;
          color: ${({ theme }) => theme.colors.text.secondary};
          margin-top: 4px;
          display: block;
          text-align: right;
        }

        &.typing {
          padding: 1rem 1.5rem;
        }
      }
    }

    .typing-dots {
      display: flex;
      gap: 4px;
      align-items: center;

      span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: ${({ theme }) => theme.colors.heading};
        opacity: 0.4;
        animation: bounce 1.4s ease-in-out infinite both;

        &:nth-child(1) { animation-delay: -0.32s; }
        &:nth-child(2) { animation-delay: -0.16s; }
        &:nth-child(3) { animation-delay: 0s; }
      }
    }
  }

  .ai-chat-input {
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.3);
    display: flex;
    align-items: center;
    gap: 0.75rem;

    input {
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: 24px;
      border: 1px solid rgba(${({ theme }) => theme.colors.border}, 0.5);
      background-color: ${({ theme }) => theme.colors.bg.secondary};
      color: ${({ theme }) => theme.colors.heading};
      font-size: 0.9rem;
      outline: none;

      &:focus {
        border-color: ${({ theme }) => theme.colors.primaryRgb};
      }

      &::placeholder {
        color: ${({ theme }) => theme.colors.text.secondary};
      }
    }

    .send-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.primaryRgb};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      cursor: pointer;
      border: none;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.05);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  @media (max-width: ${({ theme }) => theme.media.mobile}) {
    .ai-chat-header .back-btn {
      display: block;
    }
  }
`;
