import 'typeface-roboto';
import React, { useEffect, useCallback, useReducer } from 'react';
import { produce, enableMapSet } from 'immer';
import Chat from './Chat';
import { Login } from './Login';
import { red } from '@material-ui/core/colors';
import { ThemeProvider, createMuiTheme } from '@material-ui/core';

enableMapSet();

type State = {
  loginInProgress: boolean;
  client: Client | undefined;
  authData: string | undefined;
  roomLog: RoomEvent[];
  rooms: Rooms;
};

type InitAction = {
  type: 'init';
};

type StartLoginAction = {
  type: 'startLogin';
};

type StopLoginAction = {
  type: 'stopLogin';
};

type SetClientAction = {
  type: 'setClient';
  payload: Client | undefined;
};

type SetAuthDataAction = {
  type: 'setAuthData';
  payload: string | undefined;
};

type AddRoomEventAction = {
  type: 'addRoomEvent';
  payload: RoomEvent;
};

type UserJoinedAction = {
  type: 'userJoined';
  payload: { user: string; room: string };
};

type UserLeftAction = {
  type: 'userLeft';
  payload: { user: string; room: string };
};

type Action =
  | InitAction
  | StartLoginAction
  | StopLoginAction
  | SetClientAction
  | SetAuthDataAction
  | AddRoomEventAction
  | UserJoinedAction
  | UserLeftAction;

const initialState: State = {
  loginInProgress: false,
  client: undefined,
  authData: undefined,
  roomLog: [],
  rooms: {},
};

function reducer(state: State, action: Action) {
  return produce(state, draft => {
    switch (action.type) {
      case 'init':
        Object.assign(draft, initialState);
        break;

      case 'startLogin':
        draft.loginInProgress = true;
        break;

      case 'stopLogin':
        draft.loginInProgress = false;
        break;

      case 'setClient':
        draft.client = action.payload;
        break;

      case 'setAuthData':
        draft.authData = action.payload;
        break;

      case 'addRoomEvent':
        draft.roomLog.push(action.payload);
        break;

      case 'userJoined': {
        let item = draft.rooms[action.payload.room];

        if (!item) {
          item = { users: new Set() };
          draft.rooms[action.payload.room] = item;
        }

        item.users.add(action.payload.user);

        break;
      }

      case 'userLeft': {
        if (action.payload.user === draft.authData) {
          delete draft.rooms[action.payload.room];
          return;
        }

        let item = draft.rooms[action.payload.room];

        if (item) {
          item.users.delete(action.payload.user);
        }
        break;
      }

      default:
        throw Error('unknown action');
    }
  });
}

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
