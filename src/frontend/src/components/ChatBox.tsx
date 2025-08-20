import { Button } from '@mui/material';
import styles from './ChatBox.module.css';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

async function* readData(url: string, options: RequestInit) {
  const decoder = new TextDecoder();

  const response = await fetch(url, options);

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      return;
    }

    const chunk = decoder.decode(value, { stream: true });

    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const jsonString = line.substring(6);
          const parsed = JSON.parse(jsonString);
          if (parsed.type === 'text_delta' && parsed.content) {
            yield parsed.content;
          }
        } catch (error) {
          // Skip invalid JSON
        }
      }
    }
  }
}

function ChatBox() {
  // Set state
  const [message, setMessage] = useState('');
  const [messageHistory, setMessageHistory] = useState<
    Array<{ user: string; text: string }>
  >([]);
  const [currentResponse, setCurrentResponse] = useState('');

  // Send JSON Object where {"message": "Hello"}
  const onSubmitMessage = async () => {
    const userMsg = { user: 'User', text: message };

    // Add user message to history
    setMessageHistory((prev) => [...prev, userMsg]);

    // Clear input and prepare for AI response
    setMessage('');
    setCurrentResponse('');

    // Stream AI response
    let aiResponseText = '';
    for await (const chunk of readData('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMsg.text,
        thread_id: 'thread_vnutynFwuqo65JGkBM8QFNIe',
        agent_id: 'asst_C4XqPT0ZuRcZ0tPr5UKKTYes',
      }),
    })) {
      aiResponseText += chunk;
      setCurrentResponse(aiResponseText);
    }

    // When streaming is done, add complete AI response to history
    if (aiResponseText) {
      const aiMsg = { user: 'AI', text: aiResponseText };
      setMessageHistory((prev) => [...prev, aiMsg]);
      setCurrentResponse('');
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chat}>
        {/* Render message history */}
        {messageHistory.map((msg, index) => (
          <div key={index} className={styles.message}>
            {/* Add styles.user only if msg.user is "User" */}
            <span
              className={`${styles.text} ${
                msg.user === 'User' ? styles.user : styles.ai
              }`}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </span>
          </div>
        ))}

        {/* Show current streaming response */}
        {currentResponse && (
          <div className={styles.message}>
            <span className={styles.text}>
              <ReactMarkdown>{currentResponse}</ReactMarkdown>
            </span>
          </div>
        )}
      </div>

      <TextareaAutosize
        minRows={3}
        maxRows={3}
        placeholder='Type your message here...'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <Button variant='contained' color='primary' onClick={onSubmitMessage}>
        Send
      </Button>
    </div>
  );
}

export default ChatBox;
