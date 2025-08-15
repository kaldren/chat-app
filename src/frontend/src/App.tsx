import { useState } from 'react';
import { Button } from '@mui/material';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Counter: {count}</h1>
      <Button variant='contained' onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </>
  );
}

export default App;
