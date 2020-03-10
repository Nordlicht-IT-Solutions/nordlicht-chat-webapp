import 'typeface-roboto';

import React, {
  useState,
  useCallback,
  Fragment,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
} from 'react';

import {
  Grid,
  CssBaseline,
  Box,
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
} from '@material-ui/core';

import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Group,
  Person,
} from '@material-ui/icons';
import { DrawerContent } from './DrawerContent';
import ChatInput from './ChatInput';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  '@global': {
    body: {
      height: '100%',
    },
    html: {
      height: '100%',
    },
    '#root': {
      height: '100%',
    },
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
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    // padding: theme.spacing(3),

    display: 'flex',
    flexDirection: 'column',
  },
  messages: {
    flex: '1 1 auto',
    overflowY: 'auto',
    minHeight: 0,

    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    flexGrow: 1,
  },
  user: {},
}));

type Props = {
  client: Client;
  onLogOut: () => void;
  rooms: Rooms;
  user: string;
  onRoomSelect: (roomName: string | undefined) => void;
  selectedRoom: string | undefined;
};

const df = new Intl.DateTimeFormat('default', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

const Chat: React.FC<Props> = ({
  client,
  onLogOut,
  rooms,
  user,
  selectedRoom,
  onRoomSelect,
}) => {
  const messagesRef = useRef<HTMLDivElement>(null);

  const singleRoomLog = selectedRoom ? rooms[selectedRoom].events : undefined;

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

  const messages = useMemo(
    () =>
      (singleRoomLog ?? []).map(roomEvent => (
        <Fragment key={roomEvent.id}>
          {roomEvent.type === 'join' ? (
            <Grid item>
              <b>{roomEvent.sender}</b> joined{' '}
              <small>{df.format(roomEvent.ts)}</small>
            </Grid>
          ) : roomEvent.type === 'leave' ? (
            <Grid item>
              <b>{roomEvent.sender}</b> left{' '}
              <small>{df.format(roomEvent.ts)}</small>
            </Grid>
          ) : roomEvent.type === 'message' ? (
            <Grid item container direction="column">
              <Grid item>
                <b>{roomEvent.sender}</b>{' '}
                <small>{df.format(roomEvent.ts)}</small>
              </Grid>
              <Grid item>{roomEvent.message}</Grid>
            </Grid>
          ) : (
            <Grid item>{JSON.stringify(roomEvent)} </Grid>
          )}
        </Fragment>
      )),
    [singleRoomLog],
  );

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="fixed" className={classes.appBar}>
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
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>
      <nav className={classes.drawer} aria-label="mailbox folders">
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Hidden smUp implementation="css">
          <Drawer
            // container={container}
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
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <div className={classes.messages} ref={messagesRef}>
          <Box marginTop="auto" marginBottom={1} p={1}>
            <Grid item container direction="column" spacing={1}>
              {messages}
            </Grid>
          </Box>
        </div>
        {selectedRoom && (
          <Box p={1} paddingTop={0}>
            <ChatInput client={client} selectedRoom={selectedRoom} />
          </Box>
        )}
      </main>
    </div>
  );
};

export default Chat;
