package com.studygroup.global.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.messaging.MessagingException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Async // 이 메소드는 별도의 스레드에서 비동기적으로 실행됨
    public void sendEmail(String to, String subject, String text) {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            mimeMessageHelper.setTo(to);
            mimeMessageHelper.setSubject(subject);
            // 두 번째 인자(true)는 HTML 형식으로 메일을 보낼지 여부입니다.
            mimeMessageHelper.setText(text, true);

            javaMailSender.send(mimeMessage);
            log.info("Sent email to: {}", to);
        } catch (MessagingException | MailException | jakarta.mail.MessagingException e) {
            log.error("Failed to send email to: {}", to, e);
            // 이메일 발송 실패는 전체 로직에 영향을 주지 않도록 여기서 예외를 처리합니다.
        }
    }

    // 이메일 템플릿을 만드는 헬퍼 메소드 (예시)
    public String createStudyInviteEmail(String studyTitle, String inviterName) {
        // 간단한 HTML 템플릿
        return "<html><body>" +
                "<h2>스터디 초대</h2>" +
                "<p>안녕하세요!</p>" +
                "<p><b>" + inviterName + "</b>님께서 <b>'" + studyTitle + "'</b> 스터디에 초대하셨습니다.</p>" +
                "<p>저희 웹사이트에 방문하여 초대를 확인해주세요.</p>" +
                "<a href='http://localhost:3000/notifications' style='display:inline-block;padding:10px 20px;background-color:#2196F3;color:white;text-decoration:none;border-radius:5px;'>알림 확인하기</a>" +
                "<hr>" +
                "<p>감사합니다.<br>Having 팀 드림</p>" +
                "</body></html>";
    }
}
