import React, { useState, useCallback, ChangeEvent, FormEvent } from 'react';

import { TextField } from '@material-ui/core';

type Props = {
  client: Client;
  selectedRoom: string | undefined;
};

const ChatInput: React.FC<Props> = ({ client, selectedRoom }) => {
  const [msg, setMsg] = useState('');

  const handleMsgChange = useCallback((e: ChangeEvent) => {
    setMsg((e.target as HTMLInputElement).value);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      if (msg && selectedRoom) {
        client.call('sendMessage', {
          room: selectedRoom,
          message: msg,
        });

        setMsg('');
      }
    },
    [msg, selectedRoom, client],
  );

  return (
    <form noValidate autoComplete="off" onSubmit={handleSubmit}>
      <TextField
        fullWidth
        label="Message"
        variant="outlined"
        value={msg}
        onChange={handleMsgChange}
        size="small"
        autoFocus
        // multiline
      />
    </form>
  );
};

export default ChatInput;
