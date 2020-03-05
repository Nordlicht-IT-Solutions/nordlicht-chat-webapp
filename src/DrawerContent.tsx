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
} from '@material-ui/core';
import { AccountCircle, GroupAdd, Search, Group } from '@material-ui/icons';
import { JoinRoomDialog } from './JoinRoomDialog';

type Props = {
  activeRoom: string | undefined;
  joinedRooms: string[];
  onRoomSelect: (room: string) => void;
  user: string;
  onLogOut: () => void;
  client: Client;
};

const useStyles = makeStyles(theme => ({
  appBar: {},
}));

export const DrawerContent: React.FC<Props> = ({
  activeRoom,
  joinedRooms,
  onRoomSelect,
  user,
  onLogOut,
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

  const handleJoinRoom = useCallback(() => {
    setAnchorEl(null);
    setShowJoinRoomDialog(true);
  }, []);

  const [showJoinRoomDialog, setShowJoinRoomDialog] = useState(false);

  const handleJoinRoomDialogClose = useCallback(
    (roomId?: string) => {
      setShowJoinRoomDialog(false);

      if (!roomId) {
        return;
      }

      client
        .call('joinRoom', [roomId])
        .then((res: any) => {
          console.log('JOIN ROOM', res);
          onRoomSelect(roomId);
        })
        .catch((err: any) => {
          console.log('JOIN ROOM', err);
        })
        .then(() => {
          setAnchorEl(null);
        });
    },
    [client, onRoomSelect],
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
      <AppBar position="static" className={classes.appBar}>
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
      <List
        dense
        component="nav"
        subheader={<ListSubheader>Actions</ListSubheader>}
      >
        <ListItem button onClick={handleJoinRoom}>
          <ListItemIcon>
            <GroupAdd />
          </ListItemIcon>
          <ListItemText>Join room</ListItemText>
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <Search />
          </ListItemIcon>
          <ListItemText>Find contact</ListItemText>
        </ListItem>
      </List>
      <Divider />
      <List dense subheader={<ListSubheader>Joined rooms</ListSubheader>}>
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
      <List dense subheader={<ListSubheader>Contacts</ListSubheader>}></List>
    </div>
  );
};
