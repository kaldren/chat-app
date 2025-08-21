import { Button } from '@mui/material';
import styles from './ChatBox.module.css';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { useState, useEffect, useRef } from 'react';
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
  const [message, setMessage] = useState('');
  const [messageHistory, setMessageHistory] = useState<
    { user: string; text: string }[]
  >([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageHistory, currentResponse]);

  const onSubmitMessage = async () => {
    const userMsg = { user: 'User', text: message };
    setMessageHistory((prev) => [...prev, userMsg]);
    setMessage('');
    setCurrentResponse('');

    let aiResponseText = '';
    for await (const chunk of readData('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMsg.text,
        thread_id: 'thread_vnutynFwuqo65JGkBM8QFNIe',
        agent_id: 'asst_C4XqPT0ZuRcZ0tPr5UKKTYes',
      }),
    })) {
      aiResponseText += chunk;
      setCurrentResponse(aiResponseText);
    }

    if (aiResponseText) {
      const aiMsg = { user: 'AI', text: aiResponseText };
      setMessageHistory((prev) => [...prev, aiMsg]);
      setCurrentResponse('');
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chat}>
        {messageHistory.map((msg, index) => (
          <div key={index} className={styles.message}>
            <strong>{msg.user}:</strong>
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ))}
        {currentResponse && (
          <div className={styles.message}>
            <strong>AI:</strong>
            <ReactMarkdown>{currentResponse}</ReactMarkdown>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className={styles.inputArea}>
        <TextareaAutosize
          minRows={3}
          maxRows={3}
          placeholder='Type your message here...'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) =>
            e.key === 'Enter' &&
            !e.shiftKey &&
            (e.preventDefault(), onSubmitMessage())
          }
        />
        <Button variant='contained' color='primary' onClick={onSubmitMessage}>
          Send
        </Button>
      </div>
    </div>
  );
}

export default ChatBox;
