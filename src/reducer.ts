import { produce, enableMapSet } from 'immer';

enableMapSet();

export type State = {
  loginInProgress: boolean;
  client: Client | undefined;
  authData: string | undefined;
  roomLog: RoomEvent[];
  rooms: Rooms;
};

export type InitAction = {
  type: 'init';
};

export type StartLoginAction = {
  type: 'startLogin';
};

export type StopLoginAction = {
  type: 'stopLogin';
};

export type SetClientAction = {
  type: 'setClient';
  payload: Client | undefined;
};

export type SetAuthDataAction = {
  type: 'setAuthData';
  payload: string | undefined;
};

export type AddRoomEventAction = {
  type: 'addRoomEvent';
  payload: RoomEvent;
};

export type UserJoinedAction = {
  type: 'userJoined';
  payload: { user: string; room: string };
};

export type UserLeftAction = {
  type: 'userLeft';
  payload: { user: string; room: string };
};

export type Action =
  | InitAction
  | StartLoginAction
  | StopLoginAction
  | SetClientAction
  | SetAuthDataAction
  | AddRoomEventAction
  | UserJoinedAction
  | UserLeftAction;

export const initialState: State = {
  loginInProgress: false,
  client: undefined,
  authData: undefined,
  roomLog: [],
  rooms: {},
};

export function reducer(state: State, action: Action) {
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
