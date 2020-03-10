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
  Chip,
  ListItemSecondaryAction,
} from '@material-ui/core';

import {
  AccountCircle,
  GroupAdd,
  Group,
  PersonAdd,
  Person,
} from '@material-ui/icons';

import { JoinRoomDialog } from './JoinRoomDialog';
import { FindUserDialog } from './FindUserDialog';

type Props = {
  activeRoom: string | undefined;
  rooms: Rooms;
  onRoomSelect: (room: string) => void;
  user: string;
  onLogOut: () => void;
  client: Client;
};

const useStyles = makeStyles(theme => ({
  subheaderWithButton: { display: 'flex', justifyContent: 'space-between' },
}));

export const DrawerContent: React.FC<Props> = ({
  activeRoom,
  rooms,
  onRoomSelect,
  user,
  onLogOut,
  client,
}) => {
  const handleRoomClick: MouseEventHandler<HTMLElement> = useCallback(
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
    (userToAdd?: string) => {
      setShowFindUserDialog(false);

      if (!userToAdd) {
        return;
      }

      const room = `!${[userToAdd, user].sort().join('!')}`;

      client
        .call('joinRoom', [room])
        .then((res: any) => {
          console.info('ADD CONTACT', res);
          onRoomSelect(room);
        })
        .catch((err: any) => {
          console.error('ADD CONTACT', err);
        })
        .then(() => {
          setAnchorEl(null);
        });
    },
    [client, onRoomSelect, user],
  );

  const classes = useStyles();

  return (
    <div>
      <JoinRoomDialog
        client={client}
        open={showJoinRoomDialog}
        onClose={handleJoinRoomDialogClose}
        joinedRooms={Object.keys(rooms)}
      />
      <FindUserDialog
        client={client}
        open={showFindUserDialog}
        onClose={handleFindUserDialogClose}
        knownUsers={[
          user,
          ...Object.keys(rooms)
            .filter(room => room.startsWith('!'))
            .map(room => room.replace(`!${user}`, '').slice(1)),
        ]}
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
        {Object.keys(rooms)
          .filter(name => !name.startsWith('!'))
          .map(name => (
            <ListItem
              key={name}
              button
              data-id={name}
              onClick={handleRoomClick}
              selected={name === activeRoom}
            >
              <ListItemIcon>
                <Group />
              </ListItemIcon>
              <ListItemText>{name}</ListItemText>
              <ListItemSecondaryAction>
                {getUnreadComponent(rooms, name)}
              </ListItemSecondaryAction>
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
              <PersonAdd />
            </IconButton>
          </ListSubheader>
        }
      >
        {Object.keys(rooms)
          .filter(name => name.startsWith('!'))
          .map(name => {
            return (
              <ListItem
                key={name}
                button
                data-id={name}
                onClick={handleRoomClick}
                selected={name === activeRoom}
              >
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText>
                  {name.replace(`!${user}`, '').slice(1)}
                </ListItemText>
                <ListItemSecondaryAction>
                  {getUnreadComponent(rooms, name)}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
      </List>
    </div>
  );
};

function getUnreadComponent(rooms: Rooms, name: string) {
  const count = rooms[name].events.filter(evt => evt.ts > rooms[name].lastRead)
    .length;

  return count ? <Chip label={count} size="small" color="primary" /> : null;
}
