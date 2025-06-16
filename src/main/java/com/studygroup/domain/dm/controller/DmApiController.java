package com.studygroup.domain.dm.controller;

import com.studygroup.domain.dm.dto.DmDto;
import com.studygroup.domain.dm.service.DmService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dm")
@RequiredArgsConstructor
public class DmApiController {

    private final DmService dmService;

    @GetMapping("/rooms")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DmDto.RoomResponse>> getMyDmRooms(@CurrentUser UserPrincipal userPrincipal) {
        return ResponseEntity.ok(dmService.getDmRooms(userPrincipal.getId()));
    }

    @PostMapping("/rooms/find-or-create")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DmDto.RoomResponse> findOrCreateRoom(@RequestParam Long partnerId, @CurrentUser UserPrincipal userPrincipal) {
        return ResponseEntity.ok(dmService.findOrCreateRoom(userPrincipal.getId(), partnerId));
    }

    @GetMapping("/rooms/{roomId}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<DmDto.MessageResponse>> getMessages(
            @PathVariable Long roomId,
            @CurrentUser UserPrincipal userPrincipal,
            @PageableDefault(size = 30) Pageable pageable) {
        return ResponseEntity.ok(dmService.getMessages(roomId, userPrincipal.getId(), pageable));
    }
}
