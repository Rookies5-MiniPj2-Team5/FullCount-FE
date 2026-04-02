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
      stompClient.current.subscribe(`/topic/chat/${roomId}`, (frame) => {
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
        content: content,
        type: 'TALK'
      };

      stompClient.current.send(`/app/chat/${roomId}`, {}, JSON.stringify(chatMessage));
    }
  };

  return { messages, setMessages, sendMessage };
};