import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

export const useChat = (roomId, currentUser) => {
  const [messages, setMessages] = useState([]);
  const stompClient = useRef(null);

  useEffect(() => {
    // 1. 백엔드 설정에 맞춘 Endpoint 연결 (/ws)
    const socket = new SockJS('http://localhost:8080/ws');
    stompClient.current = Stomp.over(socket);

    stompClient.current.connect({}, () => {
      console.log(`채팅방 ${roomId} 연결 성공!`);

      // 2. 메시지 구독 (BE 설정: /topic으로 시작)
      // 보통 채팅방별 구독 경로는 /topic/chat/room/{roomId} 등으로 설계합니다.
      stompClient.current.subscribe(`/topic/chat/room/${roomId}`, (frame) => {
        const newMessage = JSON.parse(frame.body);
        setMessages((prev) => [...prev, newMessage]);
      });
    }, (error) => {
      console.error('웹소켓 연결 실패:', error);
    });

    return () => {
      if (stompClient.current) stompClient.current.disconnect();
    };
  }, [roomId]);

  // 3. 메시지 발행 (BE 설정: /app으로 시작)
  const sendMessage = (content) => {
    if (stompClient.current && stompClient.current.connected && content) {
      const chatMessage = {
        roomId: roomId,
        senderId: currentUser.id,
        senderNickname: currentUser.nickname,
        message: content,
        type: 'TALK'
      };

      // BE의 @MessageMapping("/chat/message")와 연결된다면 아래 경로가 됩니다.
      stompClient.current.send("/app/chat/message", {}, JSON.stringify(chatMessage));
    }
  };

  return { messages, setMessages, sendMessage };
};