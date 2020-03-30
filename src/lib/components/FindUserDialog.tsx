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
  onClose: (user?: string) => void;
  client: Client;
  knownUsers: string[];
};

export const FindUserDialog: React.FC<Props> = ({
  open,
  onClose,
  client,
  knownUsers,
}) => {
  const [user, setUser] = useState('');

  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      client.call('getUsers', []).then((users: string[]) => {
        const kus = new Set(knownUsers);

        setUsers(users.filter(user => !kus.has(user)).sort());
      });

      setUser('');
    }
  }, [client, open, knownUsers]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onClose(user || undefined);
    },
    [onClose, user],
  );

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Which user to contact?</DialogTitle>
        <DialogContent>
          <DialogContentText>Find user to contact.</DialogContentText>
          <Autocomplete
            options={users}
            renderInput={params => (
              <TextField
                {...params}
                label="Contact name"
                variant="outlined"
                margin="dense"
                fullWidth
              />
            )}
            onChange={(_, value) => {
              if (value) {
                setUser(value);
              }
            }}
            multiple={false}
          />
        </DialogContent>
        <DialogActions>
          <Button type="button" autoFocus onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button type="submit" color="primary" autoFocus disabled={!user}>
            Add contact
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
