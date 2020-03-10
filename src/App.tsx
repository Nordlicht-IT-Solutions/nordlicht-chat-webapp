import 'typeface-roboto';
import React, { useEffect, useCallback, useReducer } from 'react';
import Chat from './Chat';
import { Login } from './Login';
import { red } from '@material-ui/core/colors';
import { ThemeProvider, createMuiTheme } from '@material-ui/core';
import { reducer, initialState } from './reducer';

const theme = createMuiTheme({
  palette: {
    primary: red,
  },
});

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.client !== undefined) {
      return;
    }

    const ws = new WebSocket('ws://localhost:8080');

    const calls = new Map();

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
        }
      } else if (id !== undefined && (error || result !== undefined)) {
        const { resolve, reject } = calls.get(id);

        calls.delete(id);

        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    });

    ws.addEventListener('error', event => {
      console.error('WS Error', event);
    });

    ws.addEventListener('close', event => {
      console.info('WS Close', event);
    });

    dispatch({ type: 'setClient', payload: { ws, call, eventTarget } });
  }, [state.client]);

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
    if (!state.client) {
      return;
    }

    state.client.call('logout', []).then(() => {
      state.client?.ws.close();

      window.localStorage.removeItem('user');

      dispatch({ type: 'init' });
    });
  }, [state.client]);

  return (
    <ThemeProvider theme={theme}>
      {state.loginInProgress ? (
        <div>Logging in...</div>
      ) : state.client && state.authData ? (
        <Chat
          client={state.client}
          roomLog={state.roomLog}
          onLogOut={handleLogOut}
          rooms={state.rooms}
          user={state.authData}
        />
      ) : state.client ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div>Loading...</div>
      )}
    </ThemeProvider>
  );
};

export default App;
