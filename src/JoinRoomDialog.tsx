import React, { useCallback, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@material-ui/core';

type Props = { open: boolean; onClose: (room?: string) => void };

export const JoinRoomDialog: React.FC<Props> = ({ open, onClose }) => {
  const [room, setRoom] = useState('');

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onClose(room);
    },
    [onClose, room],
  );

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Which room to join?</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Room"
            fullWidth
            value={room}
            onChange={e => {
              setRoom(e.target.value);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" autoFocus onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button type="submit" color="primary" autoFocus>
            Join
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
