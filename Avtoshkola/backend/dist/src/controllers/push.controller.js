"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unsubscribe = exports.subscribe = exports.getVapidPublicKey = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/push/vapid-public-key  — public, no auth needed
const getVapidPublicKey = (_req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) {
        (0, response_1.sendError)(res, 'Push notifications not configured.', 503);
        return;
    }
    (0, response_1.sendSuccess)(res, { publicKey: key });
};
exports.getVapidPublicKey = getVapidPublicKey;
// POST /api/push/subscribe
const subscribe = async (req, res) => {
    const profileId = req.user.id;
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        (0, response_1.sendError)(res, 'endpoint and keys (p256dh, auth) are required.', 422);
        return;
    }
    // Upsert by endpoint so re-subscribing doesn't duplicate
    const { error } = await supabase_1.supabase.from('push_subscriptions').upsert({ profile_id: profileId, endpoint, keys }, { onConflict: 'endpoint' });
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, { ok: true }, 201);
};
exports.subscribe = subscribe;
// DELETE /api/push/unsubscribe
const unsubscribe = async (req, res) => {
    const profileId = req.user.id;
    const { endpoint } = req.body;
    if (!endpoint) {
        (0, response_1.sendError)(res, 'endpoint is required.', 422);
        return;
    }
    await supabase_1.supabase.from('push_subscriptions')
        .delete()
        .eq('profile_id', profileId)
        .eq('endpoint', endpoint);
    (0, response_1.sendSuccess)(res, { ok: true });
};
exports.unsubscribe = unsubscribe;
//# sourceMappingURL=push.controller.js.map