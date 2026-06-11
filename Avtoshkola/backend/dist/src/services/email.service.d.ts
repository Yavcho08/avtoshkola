export declare function sendLessonCreatedEmails(lesson: {
    student_id: string;
    instructor_id: string;
    type: string;
    start_time: string;
    end_time: string;
    students?: any;
    instructors?: any;
    vehicles?: any;
}): Promise<void>;
export declare function sendLessonCancelledEmails(lesson: {
    type: string;
    start_time: string;
    students?: any;
    instructors?: any;
}): Promise<void>;
export declare function sendLessonCompletedEmail(lesson: {
    type: string;
    start_time: string;
    grade?: number | null;
    instructor_notes?: string | null;
    students?: any;
}): Promise<void>;
