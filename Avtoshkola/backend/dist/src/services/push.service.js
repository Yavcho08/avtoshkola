"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToUser = sendPushToUser;
exports.sendPushToMany = sendPushToMany;
const web_push_1 = __importDefault(require("web-push"));
const supabase_1 = require("../config/supabase");
web_push_1.default.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:admin@avtoshkola.bg', process.env.VAPID_PUBLIC_KEY ?? '', process.env.VAPID_PRIVATE_KEY ?? '');
async function sendPushToUser(profileId, payload) {
    const { data: subs } = await supabase_1.supabase
        .from('push_subscriptions')
        .select('*')
        .eq('profile_id', profileId);
    if (!subs?.length)
        return;
    const dead = [];
    await Promise.allSettled(subs.map(async (sub) => {
        try {
            await web_push_1.default.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload));
        }
        catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404)
                dead.push(sub.id);
        }
    }));
    if (dead.length) {
        await supabase_1.supabase.from('push_subscriptions').delete().in('id', dead);
    }
}
async function sendPushToMany(profileIds, payload) {
    await Promise.allSettled(profileIds.map(id => sendPushToUser(id, payload)));
}
//# sourceMappingURL=push.service.js.map