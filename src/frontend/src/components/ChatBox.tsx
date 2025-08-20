import { Button } from '@mui/material';
import styles from './ChatBox.module.css';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { useState } from 'react';

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
  const [response, setResponse] = useState('');

  // Send JSON Object where {"message": "Hello"}
  const onSubmitMessage = async () => {
    for await (const chunk of readData('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        thread_id: 'thread_vnutynFwuqo65JGkBM8QFNIe',
        agent_id: 'asst_C4XqPT0ZuRcZ0tPr5UKKTYes',
      }),
    })) {
      setResponse((prev) => prev + chunk);
    }

    setMessage('');
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chat}>
        <div className={styles.message}>
          <span className={styles.user}>AI:</span>
          <span className={styles.text}>{response}</span>
        </div>
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
