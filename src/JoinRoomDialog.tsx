import React, { useCallback, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  DialogContentText,
} from '@material-ui/core';

import Autocomplete from '@material-ui/lab/Autocomplete';

type Props = {
  open: boolean;
  onClose: (room?: string) => void;
  client: Client;
  joinedRooms: string[];
};

export const JoinRoomDialog: React.FC<Props> = ({
  open,
  onClose,
  client,
  joinedRooms,
}) => {
  const [room, setRoom] = useState('');

  const [rooms, setRooms] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      client.call('getRooms', []).then((rooms: string[]) => {
        const jrs = new Set(joinedRooms);

        setRooms(rooms.filter(room => !jrs.has(room) && !room.startsWith('!')));
      });

      setRoom('');
    }
  }, [client, open, joinedRooms]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onClose(room || undefined);
    },
    [onClose, room],
  );

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Which room to join?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select existing or create new room.
          </DialogContentText>
          <Autocomplete
            freeSolo
            autoSelect
            options={rooms}
            renderInput={params => (
              <TextField
                {...params}
                label="Room"
                variant="outlined"
                margin="dense"
                fullWidth
              />
            )}
            onChange={(_, value) => {
              if (value) {
                setRoom(value);
              }
            }}
            multiple={false}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" autoFocus onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            autoFocus
            // disabled={!room}
          >
            Join
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
