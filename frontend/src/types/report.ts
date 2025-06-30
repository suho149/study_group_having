// 신고 대상의 타입을 정의하는 Enum
// 백엔드의 ReportType Enum과 반드시 일치해야 합니다.
export enum ReportType {
    POST = 'POST',
    COMMENT = 'COMMENT',
    STUDY_GROUP = 'STUDY_GROUP',
}

// (선택 사항) 신고 API 요청 시 사용될 DTO 타입
export interface ReportRequest {
    reportType: ReportType;
    targetId: number;
    reason: string;
}

// (선택 사항) 관리자 페이지에서 신고 목록을 받을 때 사용할 타입
export interface ReportResponse {
    id: number;
    reporter: {
        id: number;
        name: string;
    };
    reportType: ReportType;
    targetId: number;
    reportedUser?: {
        id: number;
        name: string;
    };
    reason: string;
    status: 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED';
    adminMemo?: string;
    createdAt: string;
}

// --- 이 Enum을 추가합니다 ---
export enum ReportStatus {
    RECEIVED = 'RECEIVED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
}

// ReportDetailDto 타입 정의 추가
export interface ReportDetailDto {
    id: number;
    reportType: ReportType;
    targetId: number;
    targetContentPreview: string;
    reason: string;
    status: ReportStatus;
    reporterName: string;
    reportedUserName: string;
    createdAt: string;
    adminMemo: string;
}