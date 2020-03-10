import React, { Fragment, useRef, useLayoutEffect, useMemo } from 'react';

import { Grid, Box, makeStyles, createStyles } from '@material-ui/core';

import ChatInput from './ChatInput';

const useStyles = makeStyles(theme =>
  createStyles({
    toolbar: theme.mixins.toolbar,
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
  }),
);

type Props = {
  client: Client;
  roomEvents: RoomEvent[];
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

const Messages: React.FC<Props> = ({ client, roomEvents, selectedRoom }) => {
  const messagesRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [roomEvents]);

  const classes = useStyles();

  const messages = useMemo(
    () =>
      (roomEvents ?? []).map(roomEvent => (
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
    [roomEvents],
  );

  return (
    <main className={classes.content}>
      <div className={classes.toolbar} />
      <div className={classes.messages} ref={messagesRef}>
        <Box marginTop="auto" marginBottom={1} p={1}>
          <Grid item container direction="column" spacing={1}>
            {messages}
          </Grid>
        </Box>
      </div>
      <Box p={1} paddingTop={0}>
        <ChatInput client={client} selectedRoom={selectedRoom} />
      </Box>
    </main>
  );
};

export default Messages;
