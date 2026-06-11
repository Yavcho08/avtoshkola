export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
}
export declare function sendPushToUser(profileId: string, payload: PushPayload): Promise<void>;
export declare function sendPushToMany(profileIds: string[], payload: PushPayload): Promise<void>;
