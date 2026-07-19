/**
 * Notification Service - For testing email/SMS
 */

import apiClient from "../utils/apiClient";

export const notificationService = {
    /**
     * Send test email
     */
    async sendTestEmail(to, subject, body) {
        return apiClient.post('/notifications/test-email', {
            to,
            subject,
            body,
        });
    },

    /**
     * Send test SMS
     */
    async sendTestSms(phoneNumber, message) {
        return apiClient.post('/notifications/test-sms', {
            phoneNumber,
            message,
        });
    },
};

export default notificationService;
