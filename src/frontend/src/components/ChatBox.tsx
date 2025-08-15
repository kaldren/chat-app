import styles from './ChatBox.module.css';
import TextareaAutosize from '@mui/material/TextareaAutosize';

function ChatBox() {
  return (
    <div className={styles.chatContainer}>
      <h2 className={styles.h2}>Let's Chat!</h2>

      <TextareaAutosize
        minRows={3}
        maxRows={3}
        placeholder='Type your message here...'
      />
    </div>
  );
}

export default ChatBox;
