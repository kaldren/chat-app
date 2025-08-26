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
    const threadId = await GetThreadId();
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
        thread_id: threadId,
        agent_id: 'asst_7wE0L2Hi30BwLoqY0VTLtD1M',
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
          <div
            key={index}
            className={`${styles.message} ${
              msg.user === 'User' ? styles.user : styles.ai
            }`}
          >
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        ))}
        {currentResponse && (
          <div className={styles.message}>
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

async function GetThreadId() {
  const thread_id = localStorage.getItem('thread_id');

  // Include undefined check
  if (thread_id === 'undefined' || thread_id === null) {
    // If no thread_id is found, create a new thread
    const response = await fetch('http://localhost:8000/new-thread', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    console.log(data);
    localStorage.setItem('thread_id', data.thread_id);
    return data.thread_id;
  }
  console.log(thread_id);
  return thread_id;
}

export default ChatBox;
