interface Client {
  ws: WebSocket;
  call: (method: string, params: object | any[]) => Promise<any>;
  eventTarget: EventTarget;
}

interface BaseRoomEvent {
  id: number;
  ts: number;
  sender: string;
  room: string;
}

interface MessageRoomEvent extends BaseRoomEvent {
  type: 'message';
  message: string;
}

interface JoinRoomEvent extends BaseRoomEvent {
  type: 'join';
}

interface LeaveRoomEvent extends BaseRoomEvent {
  type: 'leave';
}

type RoomEvent = MessageRoomEvent | JoinRoomEvent | LeaveRoomEvent;

type Room = {
  name: string;
  users: Set<string>;
  roomEvents: RoomEvent[];
};

type Rooms = {
  [key: string]: { users: Set<string>; events: RoomEvent[]; lastRead: number };
};
