/**
 * stompLiveClient.js
 *
 * 실시간 응원 채팅 전용 STOMP 클라이언트 유틸리티.
 * 팀원이 담당하는 일반 ChatPage의 STOMP 로직과 독립적으로 동작합니다.
 *
 * - 구독 경로: /topic/live-cheer/{gameId}
 * - 발행 경로: /app/live-cheer/{gameId}
 */
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { getToken } from './auth';

const WS_URL = 'http://localhost:8080/ws';

export function createLiveCheerClient({ gameId, onMessage, onConnected, onDisconnected }) {
  let client = null;
  let isConnecting = false;

  function connect() {
    if (isConnecting || client?.connected) return;
    isConnecting = true;

    const token = getToken();
    const socket = new SockJS(WS_URL);
    client = Stomp.over(socket);
    client.debug = null; // 콘솔 STOMP 로그 비활성화

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    client.connect(
      headers,
      () => {
        isConnecting = false;
        onConnected?.();
        client.subscribe(`/topic/live-cheer/${gameId}`, (frame) => {
          try {
            const msg = JSON.parse(frame.body);
            onMessage?.(msg);
          } catch (e) {
            console.error('[LiveCheer] 메시지 파싱 오류:', e);
          }
        });
      },
      (err) => {
        console.error('[LiveCheer] STOMP 연결 실패:', err);
        isConnecting = false;
        onDisconnected?.();
      }
    );
  }

  function sendChat(content) {
    if (!client?.connected) return;
    client.send(`/app/live-cheer/${gameId}`, {}, JSON.stringify({
      type: 'CHAT',
      content,
    }));
  }

  function sendReaction(reactionId) {
    if (!client?.connected) return;
    client.send(`/app/live-cheer/${gameId}`, {}, JSON.stringify({
      type: 'REACTION',
      reactionId,
    }));
  }

  function disconnect() {
    if (client?.connected) {
      client.disconnect(() => {
        onDisconnected?.();
      });
    }
    client = null;
    isConnecting = false;
  }

  return { connect, disconnect, sendChat, sendReaction };
}
