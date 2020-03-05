import 'typeface-roboto';

import React, {
  useState,
  useCallback,
  ChangeEvent,
  FormEvent,
  Fragment,
  MouseEventHandler,
  useMemo,
  useEffect,
} from 'react';

import {
  Grid,
  TextField,
  CssBaseline,
  Box,
  Typography,
  AppBar,
  Toolbar,
  Drawer,
  makeStyles,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Button,
} from '@material-ui/core';

import { Menu as MenuIcon, AccountCircle } from '@material-ui/icons';

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
    flexDirection: 'column',
    height: '100%',
  },
  messages: {
    flex: '1 1 auto',
    overflowY: 'auto',
    minHeight: 0,

    display: 'flex',
    flexDirection: 'column',
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  user: {},
}));

type Props = {
  client: Client;
  onLogOut: () => void;
  roomLog: RoomEvent[];
  rooms: Rooms;
  user: string;
};

type MessageProps = {
  value: MessageRoomEvent;
};

const df = new Intl.DateTimeFormat('default', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

const Message: React.FC<MessageProps> = ({ value }) => (
  <Grid item container direction="column">
    <Grid item>
      <b>{value.sender}</b> <small>{df.format(value.ts)}</small>
    </Grid>
    <Grid item>{value.message}</Grid>
  </Grid>
);

const Chat: React.FC<Props> = ({ client, onLogOut, roomLog, rooms, user }) => {
  const [roomId, setRoomId] = useState<string | undefined>(undefined);

  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (roomId && !rooms[roomId]) {
      setRoomId(undefined);
    }
  }, [roomId, rooms]);

  const handleMsgChange = useCallback((e: ChangeEvent) => {
    setMsg((e.target as HTMLInputElement).value);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      if (msg) {
        client.call('sendMessage', { to: 'room', room: roomId, message: msg });

        setMsg('');
      }
    },
    [msg, roomId, client],
  );

  const classes = useStyles();

  const [drawerOpened, setDrawerOpened] = useState(false);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpened(false);
  }, []);

  const handleMenuButtonClick = useCallback(() => {
    setDrawerOpened(true);
  }, []);

  const handleRoomClick: MouseEventHandler<HTMLElement> = useCallback(e => {
    setDrawerOpened(false);
    setRoomId(e.currentTarget.dataset.id);
  }, []);

  const singleRoomLog = useMemo(
    () => roomLog.filter(log => log.room === roomId),
    [roomLog, roomId],
  );

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleJoinRoom = useCallback(() => {
    const roomId = window.prompt('Which room?');

    if (!roomId) {
      return;
    }

    client
      .call('joinRoom', [roomId])
      .then((res: any) => {
        console.log('JOIN ROOM', res);
        setRoomId(roomId);
      })
      .catch((err: any) => {
        console.log('JOIN ROOM', err);
      })
      .then(() => {
        setAnchorEl(null);
      });
  }, [client]);

  const handleLeaveRoom = useCallback(() => {
    client
      .call('leaveRoom', [roomId])
      .then((res: any) => {
        console.log('LEAVE ROOM', res);
      })
      .catch((err: any) => {
        console.log('LEAVE ROOM', err);
      })
      .then(() => {
        setAnchorEl(null);
      });
  }, [client, roomId]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogOut = useCallback(() => {
    onLogOut();
    setAnchorEl(null);
  }, [onLogOut]);

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
            onClick={handleMenuButtonClick}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            {roomId ? roomId : <i>No chat active</i>}
          </Typography>
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
            {/* <MenuItem onClick={handleCreateRoom}>Create room</MenuItem> */}
            <MenuItem onClick={handleJoinRoom}>Join room</MenuItem>
            <MenuItem onClick={handleLeaveRoom}>Leave room</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer open={drawerOpened} onClose={handleDrawerClose}>
        <List dense>
          {Object.keys(rooms).map(room => (
            <ListItem
              key={room}
              button
              data-id={room}
              onClick={handleRoomClick}
            >
              <ListItemText>{room}</ListItemText>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box className={classes.messages}>
        <Box marginTop="auto" marginBottom={1} p={1}>
          <Grid item container direction="column" spacing={1}>
            {singleRoomLog.map(roomEvent => (
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
                  <Message value={roomEvent} />
                ) : (
                  <Grid item>{JSON.stringify(roomEvent)} </Grid>
                )}
              </Fragment>
            ))}
          </Grid>
        </Box>
      </Box>
      <Box p={1}>
        <form noValidate autoComplete="off" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Message"
            variant="outlined"
            value={msg}
            onChange={handleMsgChange}
            size="small"
            // multiline
          />
        </form>
      </Box>
    </div>
  );
};

export default Chat;
