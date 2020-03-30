import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react';

import {
  Typography,
  AppBar,
  Toolbar,
  Drawer,
  makeStyles,
  IconButton,
  Menu,
  MenuItem,
  Hidden,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';

import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Group,
  Person,
  PersonAdd,
  Chat as ChatIcon,
} from '@material-ui/icons';

import { DrawerContent } from './DrawerContent';
import Messages from './Messages';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  '@global': {
    // body: {
    //   height: '100%',
    // },
    // html: {
    //   height: '100%',
    // },
    // '#root': {
    //   height: '100%',
    // },
  },
  root: {
    display: 'flex',
    flexGrow: 1,
    height: '100%',
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  appBar: {
    [theme.breakpoints.up('sm')]: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  drawerPaper: {
    width: drawerWidth,
    position: 'absolute',
  },
  title: {
    flexGrow: 1,
  },
}));

type Props = {
  client: Client;
  onLogOut: () => void;
  rooms: Rooms;
  user: string;
  onRoomSelect: (roomName: string | undefined) => void;
  selectedRoom: string | undefined;
};

const Chat: React.FC<Props> = ({
  client,
  onLogOut,
  rooms,
  user,
  selectedRoom,
  onRoomSelect,
}) => {
  const messagesRef = useRef<HTMLDivElement>(null);

  const singleRoomLog = selectedRoom
    ? rooms[selectedRoom]?.events ?? undefined
    : undefined;

  useLayoutEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [singleRoomLog]);

  useEffect(() => {
    if (selectedRoom && !rooms[selectedRoom]) {
      onRoomSelect(undefined);
    }
  }, [onRoomSelect, selectedRoom, rooms]);

  const classes = useStyles();

  const theme = useTheme();

  const [drawerOpened, setDrawerOpened] = useState(false);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpened(false);
  }, []);

  const handleMenuButtonClick = useCallback(() => {
    setDrawerOpened(true);
  }, []);

  const handleRoomSelect = useCallback(
    roomName => {
      setDrawerOpened(false);
      onRoomSelect(roomName);
    },
    [onRoomSelect],
  );

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setAnchorEl(null);

    client
      .call('leaveRoom', [selectedRoom])
      .then((res: any) => {
        console.log('LEAVE ROOM', res);
      })
      .catch((err: any) => {
        console.log('LEAVE ROOM', err);
      });
  }, [client, selectedRoom]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const [showRoomMembers, setShowRoomMembers] = useState(false);

  const handleShowRoomMembers = useCallback(() => {
    setAnchorEl(null);
    setShowRoomMembers(true);
  }, []);

  const handleShowRoomMembersDialogClose = useCallback(() => {
    setShowRoomMembers(false);
  }, []);

  const drawer = (
    <DrawerContent
      activeRoom={selectedRoom}
      rooms={rooms}
      onRoomSelect={handleRoomSelect}
      user={user}
      onLogOut={onLogOut}
      client={client}
    />
  );

  const handleAddClick = useCallback(
    (userName: string) => {
      const room = `!${[userName, user].sort().join('!')}`;

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
          setShowRoomMembers(false);
        });
    },
    [client, onRoomSelect, user],
  );

  return (
    <div className={classes.root}>
      <Dialog open={showRoomMembers} onClose={handleShowRoomMembersDialogClose}>
        <DialogTitle>Room members</DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <List dense>
              {[...(rooms[selectedRoom]?.users ?? [])].sort().map(u => (
                <ListItem key={u}>
                  <ListItemText>{u}</ListItemText>
                  {u === user ? null : Object.keys(rooms).some(
                      roomName =>
                        roomName[0] === '!' && roomName.split('!').includes(u),
                    ) ? (
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setShowRoomMembers(false);
                        onRoomSelect(`!${[u, user].join('!')}`);
                      }}
                    >
                      <ChatIcon />
                    </IconButton>
                  ) : (
                    <IconButton edge="end" onClick={() => handleAddClick(u)}>
                      <PersonAdd />
                    </IconButton>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            autoFocus
            onClick={handleShowRoomMembersDialogClose}
            color="primary"
          >
            Close
          </Button>
        </DialogActions>{' '}
      </Dialog>

      <AppBar position="absolute" className={classes.appBar}>
        <Toolbar>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="open drawer"
            onClick={handleMenuButtonClick}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            {selectedRoom ? (
              <>
                {selectedRoom.startsWith('!') ? (
                  <Person fontSize="inherit" />
                ) : (
                  <Group fontSize="inherit" />
                )}{' '}
                {selectedRoom.startsWith('!')
                  ? selectedRoom.replace(`!${user}`, '').slice(1)
                  : selectedRoom}
              </>
            ) : (
              <i>No chat active</i>
            )}
          </Typography>
          {selectedRoom && (
            <>
              <IconButton
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <SettingsIcon />
              </IconButton>
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
                <MenuItem onClick={handleLeaveRoom}>
                  {selectedRoom.startsWith('!')
                    ? 'Forget contact'
                    : 'Leave room'}
                </MenuItem>
                {!selectedRoom.startsWith('!') && (
                  <MenuItem onClick={handleShowRoomMembers}>
                    Show room members
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      <nav className={classes.drawer} aria-label="mailbox folders">
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Hidden smUp implementation="css">
          <Drawer
            variant="temporary"
            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
            open={drawerOpened}
            onClose={handleDrawerClose}
            classes={{
              paper: classes.drawerPaper,
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            {drawer}
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="css">
          <Drawer
            classes={{
              paper: classes.drawerPaper,
            }}
            variant="permanent"
            open
          >
            {drawer}
          </Drawer>
        </Hidden>
      </nav>

      {selectedRoom && (
        <Messages
          client={client}
          roomEvents={rooms[selectedRoom]?.events ?? []}
          selectedRoom={selectedRoom}
        />
      )}
    </div>
  );
};

export default Chat;
