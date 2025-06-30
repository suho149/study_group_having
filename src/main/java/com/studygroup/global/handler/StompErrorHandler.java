package com.studygroup.global.handler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class StompErrorHandler extends StompSubProtocolErrorHandler {

    public StompErrorHandler() {
        super();
    }

    @Override
    public Message<byte[]> handleClientMessageProcessingError(Message<byte[]> clientMessage, Throwable ex) {
        log.error("STOMP client message processing error: {}", ex.getMessage(), ex);
        // 클라이언트에게 보낼 에러 메시지 생성
        return prepareErrorMessage(ex, "Client message processing error");
    }

    @Override
    public Message<byte[]> handleErrorMessageToClient(Message<byte[]> errorMessage) {
        log.error("STOMP error message to client: {}", new String(errorMessage.getPayload(), StandardCharsets.UTF_8));
        // 이미 에러 메시지 형식이므로 그대로 반환하거나, 필요시 가공
        return super.handleErrorMessageToClient(errorMessage);
    }

    // 인증 실패 등의 예외를 ERROR 프레임으로 클라이언트에 전송
    private Message<byte[]> prepareErrorMessage(Throwable ex, String defaultMessage) {
        String message = ex.getMessage() != null ? ex.getMessage() : defaultMessage;
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.ERROR);
        accessor.setMessage(message); // 에러 메시지 설정
        accessor.setLeaveMutable(true);

        // 필요하다면 추가적인 에러 정보(코드 등)를 헤더에 담을 수 있음
        // accessor.setNativeHeader("error-code", "AUTH_FAILED");

        return MessageBuilder.createMessage(message.getBytes(StandardCharsets.UTF_8), accessor.getMessageHeaders());
    }
}
