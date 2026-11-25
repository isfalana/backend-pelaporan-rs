'use strict';

// [MODIFIKASI] Service terpusat untuk notifikasi: menyimpan ke database (in-app) dan mengirim push FCM
const { Notification, UserFcmToken, Sequelize } = require('../models');
const { Op } = Sequelize;

let admin;
try {
  admin = require('../utils/firebase');
} catch (error) {
  console.warn('Firebase Admin tidak tersedia di notificationService:', error.message);
}

/**
 * Mengirim notifikasi ke satu atau banyak user (In-app DB + Push FCM)
 * @param {Object} params
 * @param {string|string[]} params.id_nik_list - Satu id_nik atau array id_nik
 * @param {string} [params.id_laporan] - ID laporan terkait jika ada
 * @param {string} params.title - Judul notifikasi
 * @param {string} params.body - Isi notifikasi
 * @param {string} [params.type] - Jenis notifikasi (NEW_LAPORAN, PENDING_APPROVAL, RETURNED, COMPLETED, ASSIGN_PIC)
 */
const sendNotification = async ({ id_nik_list, id_laporan, title, body, type = 'GENERAL' }) => {
  try {
    const list = Array.isArray(id_nik_list) ? id_nik_list : [id_nik_list];
    const uniqueNiks = [...new Set(list.filter(Boolean))];

    if (!uniqueNiks.length) return;

    // 1. Simpan ke database notifications (in-app notification untuk Web, Desktop, Mobile)
    const recordsToInsert = uniqueNiks.map(nik => ({
      id_nik: nik,
      id_laporan: id_laporan || null,
      title,
      body,
      type,
      is_read: false
    }));

    await Notification.bulkCreate(recordsToInsert);

    // 2. Kirim FCM Push Notification jika Firebase Admin aktif
    if (!admin?.messaging) return;

    const fcmRecords = await UserFcmToken.findAll({
      where: {
        id_nik: { [Op.in]: uniqueNiks },
        is_active: true
      }
    });

    const tokens = [
      ...new Set(
        fcmRecords
          .map(item => item.fcm_token)
          .filter(token =>
            token &&
            token !== 'dummy_fcm_token_web' &&
            token !== 'dummy_token_fallback'
          )
      )
    ];

    if (!tokens.length) return;

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title,
        body
      },
      data: {
        id_laporan: String(id_laporan || ''),
        type: String(type || ''),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/favicon.png'
        }
      }
    });

    console.log(
      `[NotificationService] FCM Berhasil: ${response.successCount}, Gagal: ${response.failureCount}`
    );

    // Nonaktifkan token yang sudah kadaluwarsa/tidak valid
    const invalidTokens = [];
    response.responses.forEach((result, index) => {
      const code = result.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[index]);
      }
    });

    if (invalidTokens.length) {
      await UserFcmToken.update(
        { is_active: false },
        {
          where: {
            fcm_token: { [Op.in]: invalidTokens }
          }
        }
      );
    }
  } catch (error) {
    console.error('Error sendNotification:', error);
  }
};

module.exports = {
  sendNotification
};
