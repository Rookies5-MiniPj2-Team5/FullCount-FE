import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

/**
 * GlobalChatListener
 * 
 * 사용자가 로그인한 동안 백그라운드에서 실시간 알림을 감시합니다.
 * - 구독 경로: /topic/user/{nickname}
 * - 동작: 새로운 메시지나 방 생성 알림이 오면 onNotification 콜백 실행
 */
export default function GlobalChatListener({ user, onNotification }) {
  const clientRef = useRef(null);
  const isConnecting = useRef(false);

  useEffect(() => {
    if (!user?.nickname || isConnecting.current) return;

    const connect = () => {
      isConnecting.current = true;
      const socket = new SockJS("http://localhost:8080/ws");
      const client = Stomp.over(socket);
      client.debug = null; // 로그가 너무 많으면 null로 설정
      clientRef.current = client;

      client.connect(
        {},
        () => {
          console.log(`[GlobalChat] 감시 시작: ${user.nickname}`);
          isConnecting.current = false;

          // 사용자 전용 알림 토픽 구독
          client.subscribe(`/topic/user/${user.nickname}`, (frame) => {
            try {
              const notification = JSON.parse(frame.body);
              console.log("[GlobalChat] 알림 수신:", notification);
              // notification 구조 예시: { type: 'NEW_MESSAGE', roomId: 123, title: '상대방', roomType: 'ONE_ON_ONE' }
              onNotification?.(notification);
            } catch (e) {
              console.error("[GlobalChat] 알림 파싱 오류:", e);
            }
          });
        },
        (err) => {
          console.error("[GlobalChat] 연결 실패:", err);
          isConnecting.current = false;
          // 5초 후 재연결 시도
          setTimeout(connect, 5000);
        }
      );
    };

    connect();

    return () => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.disconnect(() => console.log("[GlobalChat] 감시 종료"));
      }
      clientRef.current = null;
      isConnecting.current = false;
    };
  }, [user?.nickname]);

  return null; // 화면에 아무것도 그리지 않는 헬퍼 컴포넌트
}
