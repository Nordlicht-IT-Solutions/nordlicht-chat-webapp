import React, { useCallback, MouseEventHandler, useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  makeStyles,
  AppBar,
  Toolbar,
  Button,
  Menu,
  MenuItem,
  ListSubheader,
  Divider,
  ListItemIcon,
  IconButton,
} from '@material-ui/core';
import { AccountCircle, GroupAdd, Search, Group } from '@material-ui/icons';
import { JoinRoomDialog } from './JoinRoomDialog';
import { FindUserDialog } from './FindUserDialog';

type Props = {
  activeRoom: string | undefined;
  joinedRooms: string[];
  onRoomSelect: (room: string) => void;
  user: string;
  onLogOut: () => void;
  client: Client;
  contacts: Set<string>;
};

const useStyles = makeStyles(theme => ({
  subheaderWithButton: { display: 'flex', justifyContent: 'space-between' },
}));

export const DrawerContent: React.FC<Props> = ({
  activeRoom,
  joinedRooms,
  onRoomSelect,
  user,
  onLogOut,
  contacts,
  client,
}) => {
  const handleClick: MouseEventHandler<HTMLElement> = useCallback(
    e => {
      onRoomSelect(e.currentTarget.dataset.id as string);
    },
    [onRoomSelect],
  );

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogOut = useCallback(() => {
    setAnchorEl(null);
    onLogOut();
  }, [onLogOut]);

  const [showJoinRoomDialog, setShowJoinRoomDialog] = useState(false);

  const handleJoinRoom = useCallback(() => {
    setAnchorEl(null);
    setShowJoinRoomDialog(true);
  }, []);

  const handleJoinRoomDialogClose = useCallback(
    (roomId?: string) => {
      setShowJoinRoomDialog(false);

      if (!roomId) {
        return;
      }

      client
        .call('joinRoom', [roomId])
        .then((res: any) => {
          console.info('JOIN ROOM', res);
          onRoomSelect(roomId);
        })
        .catch((err: any) => {
          console.error('JOIN ROOM', err);
        })
        .then(() => {
          setAnchorEl(null);
        });
    },
    [client, onRoomSelect],
  );

  const [showFindUserDialog, setShowFindUserDialog] = useState(false);

  const handleFindContact = useCallback(() => {
    setAnchorEl(null);
    setShowFindUserDialog(true);
  }, []);

  const handleFindUserDialogClose = useCallback(
    (user?: string) => {
      setShowFindUserDialog(false);

      if (!user) {
        return;
      }

      client
        .call('addContact', [user])
        .then((res: any) => {
          console.info('ADD CONTACT', res);
          // onRoomSelect(roomId);
        })
        .catch((err: any) => {
          console.error('ADD CONTACT', err);
        })
        .then(() => {
          setAnchorEl(null);
        });
    },
    [client],
  );

  const classes = useStyles();

  return (
    <div>
      <JoinRoomDialog
        client={client}
        open={showJoinRoomDialog}
        onClose={handleJoinRoomDialogClose}
        joinedRooms={joinedRooms}
      />
      <FindUserDialog
        client={client}
        open={showFindUserDialog}
        onClose={handleFindUserDialogClose}
        knownUsers={[]} // TODO
      />
      <AppBar position="static">
        <Toolbar>
          <Button
            startIcon={<AccountCircle />}
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            {user}
          </Button>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={handleLogOut}>Log out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Divider />
      <List
        dense
        subheader={
          <ListSubheader className={classes.subheaderWithButton}>
            <div>Joined rooms</div>
            <IconButton onClick={handleJoinRoom} edge="end">
              <GroupAdd />
            </IconButton>
          </ListSubheader>
        }
      >
        {joinedRooms.map(room => (
          <ListItem
            key={room}
            button
            data-id={room}
            onClick={handleClick}
            selected={room === activeRoom}
          >
            <ListItemIcon>
              <Group />
            </ListItemIcon>
            <ListItemText>{room}</ListItemText>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List
        dense
        subheader={
          <ListSubheader className={classes.subheaderWithButton}>
            <div>Contacts</div>
            <IconButton onClick={handleFindContact} edge="end">
              <Search />
            </IconButton>
          </ListSubheader>
        }
      >
        {[...contacts].map(contact => (
          <ListItem
            key={contact}
            button
            data-id={contact}
            // onClick={handleClick}
            // selected={room === activeRoom}
          >
            <ListItemIcon>
              <Group />
            </ListItemIcon>
            <ListItemText>{contact}</ListItemText>
          </ListItem>
        ))}
      </List>
    </div>
  );
};
