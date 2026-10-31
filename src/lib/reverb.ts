import Constants from 'expo-constants';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

/**
 * Laravel Reverb speaks the Pusher protocol over websockets. Public match
 * channels (`match.{id}`) carry the score summary on every BallScored event —
 * no auth needed for spectator subscriptions.
 */
let echo: Echo<'pusher'> | null = null;

function wsHost(): { host: string; port: number } {
  const apiUrl: string =
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
    'https://cricketamigo.test';
  // Reverb runs alongside the API host on its own port in dev.
  try {
    const u = new URL(apiUrl);
    return { host: u.hostname, port: 8080 };
  } catch {
    return { host: 'localhost', port: 8080 };
  }
}

export function getEcho(): Echo<'pusher'> {
  if (!echo) {
    const { host, port } = wsHost();
    echo = new Echo({
      broadcaster: 'pusher',
      Pusher,
      key: 'local-dev-key',
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: false,
      enabledTransports: ['ws'],
      disableStats: true,
    });
  }
  return echo;
}

/** Subscribe to a live match; returns an unsubscribe fn. */
export function subscribeMatch(
  matchId: number,
  onScore: (score: unknown) => void,
): () => void {
  const e = getEcho();
  const channel = e.channel(`match.${matchId}`);
  channel.listen('BallScored', onScore);
  return () => e.leave(`match.${matchId}`);
}
