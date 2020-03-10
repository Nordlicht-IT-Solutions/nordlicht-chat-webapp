import 'typeface-roboto';
import React, { useEffect, useCallback, useReducer } from 'react';
import Chat from './Chat';
import { Login } from './Login';
import { red } from '@material-ui/core/colors';
import {
  ThemeProvider,
  createMuiTheme,
  Backdrop,
  Paper,
  Box,
  makeStyles,
  Theme,
  createStyles,
  CssBaseline,
} from '@material-ui/core';
import { reducer, initialState } from './reducer';

const theme = createMuiTheme({
  palette: {
    primary: red,
  },
});

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
    backdrop: {
      zIndex: theme.zIndex.drawer + 1,
      color: '#fff',
    },
  }),
);

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.client !== undefined) {
      return;
    }

    dispatch({ type: 'setConnectionState', payload: { state: 'connecting' } });

    const ws = new WebSocket(
      `ws://${
        window.location.port === '3000'
          ? 'localhost:8080'
          : window.location.host
      }/chat`,
    );

    const calls = new Map<
      number,
      { resolve: (result: any) => void; reject: (err: any) => void }
    >();

    let callId = 1;

    const eventTarget = new EventTarget();

    function call(method: string, params: object | any[]) {
      return new Promise((resolve, reject) => {
        ws.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: callId,
            method,
            params,
          }),
        );

        calls.set(callId, { resolve, reject });

        callId++;
      });
    }

    ws.addEventListener('open', () => {
      console.info('WS Open');

      dispatch({ type: 'setConnectionState', payload: { state: 'connected' } });

      const user = window.localStorage.getItem('user');

      if (user) {
        dispatch({ type: 'startLogin' });

        call('login', [user])
          .then(() => {
            dispatch({ type: 'setAuthData', payload: user });
          })
          .finally(() => {
            dispatch({ type: 'stopLogin' });
          });
      }
    });

    ws.addEventListener('message', event => {
      const { id, result, error, method, params, jsonrpc } = JSON.parse(
        event.data,
      );

      if (jsonrpc !== '2.0') {
        return;
      }

      if (method && params) {
        eventTarget.dispatchEvent(new CustomEvent('method', params));

        console.log('METHOD', method, params);

        if (method === 'joinRoom') {
          dispatch({ type: 'userJoined', payload: params });
        } else if (method === 'leaveRoom') {
          dispatch({ type: 'userLeft', payload: params });
        } else if (method === 'roomEvent') {
          dispatch({ type: 'addRoomEvent', payload: params });
        } else if (method === 'lastRead') {
          dispatch({ type: 'setLastRead', payload: params });
        }
      } else if (id !== undefined && (error || result !== undefined)) {
        const call = calls.get(id);

        if (call) {
          calls.delete(id);

          if (error) {
            call.reject(error);
          } else {
            call.resolve(result);
          }
        }
      }
    });

    ws.addEventListener('error', event => {
      console.error('WS Error', event);
    });

    let timeoutRef: number | undefined;

    ws.addEventListener('close', event => {
      console.info('WS Close', event);

      for (const call of calls.values()) {
        call.reject(new Error('connection closed'));
      }

      dispatch({
        type: 'setConnectionState',
        payload: { state: 'closed', code: event.code },
      });

      if (event.code !== 1000 && event.code !== 1005) {
        timeoutRef = window.setTimeout(() => {
          timeoutRef = undefined;
          dispatch({ type: 'init' });
        }, 1000);
      }
    });

    dispatch({ type: 'setClient', payload: { ws, call, eventTarget } });

    return () => {
      // ws.close(); // TODO
      window.clearTimeout(timeoutRef);
    };
  }, [state.client]);

  useEffect(() => {
    if (state.client && state.selectedRoom) {
      const room = state.rooms[state.selectedRoom];

      if (room && room.events.length) {
        const lastRead = room.events[room.events.length - 1].ts;

        if (lastRead !== room.lastRead) {
          state.client.call('setRoomLastRead', {
            room: state.selectedRoom,
            lastRead,
          });
        }
      }
    }
  }, [state.client, state.selectedRoom, state.rooms]);

  const handleLogin = useCallback(
    (user: string, password: string) => {
      if (!state.client) {
        throw new Error('no client');
      }

      dispatch({ type: 'startLogin' });

      state.client
        .call('login', [user])
        .then(() => {
          window.localStorage.setItem('user', user);
          dispatch({ type: 'setAuthData', payload: user });
        })
        .finally(() => {
          dispatch({ type: 'stopLogin' });
        });
    },
    [state.client],
  );

  const handleLogOut = useCallback(() => {
    const client = state.client;

    if (client) {
      client.call('logout', []).then(() => {
        dispatch({ type: 'setConnectionState', payload: { state: 'closing' } });

        client?.ws.close();

        window.localStorage.removeItem('user');

        dispatch({ type: 'init' });
      });
    }
  }, [state.client]);

  const connSpecial = ['connecting', 'closing', 'closed'].includes(
    state.connectionState,
  );

  const special = connSpecial
    ? stateMapping[state.connectionState]
    : state.loginInProgress
    ? 'Logging in...'
    : !state.client
    ? 'Loading...'
    : null;

  const classes = useStyles();

  const handleRoomSelect = useCallback((room: string | undefined) => {
    dispatch({ type: 'selectRoom', payload: room });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Backdrop open={!!special} className={classes.backdrop}>
        <Paper elevation={2}>
          <Box padding={2}>{special}</Box>
        </Paper>
      </Backdrop>

      {connSpecial || !state.client ? null : state.authData ? (
        <Chat
          client={state.client}
          onLogOut={handleLogOut}
          rooms={state.rooms}
          user={state.authData}
          onRoomSelect={handleRoomSelect}
          selectedRoom={state.selectedRoom}
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </ThemeProvider>
  );
};

const stateMapping = {
  closed: 'Reconnecting...',
  connecting: 'Reconnecting...',
  closing: 'Closing...',
  connected: 'Connected.',
};

export default App;
