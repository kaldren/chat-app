import { Button } from '@mui/material';
import styles from './ChatBox.module.css';
import TextareaAutosize from '@mui/material/TextareaAutosize';

function ChatBox() {
  return (
    <div className={styles.chatContainer}>
      <div className={styles.chat}>
        <div className={styles.message}>
          <span className={styles.user}>User:</span>
          <span className={styles.text}>Hello!</span>
        </div>
        <div className={styles.message}>
          <span className={styles.user}>Bot:</span>
          <span className={styles.text}>
            Hi there! How can I help you today?
          </span>
        </div>
      </div>

      <TextareaAutosize
        minRows={3}
        maxRows={3}
        placeholder='Type your message here...'
      />

      <Button variant='contained' color='primary'>
        Send
      </Button>
    </div>
  );
}

export default ChatBox;
