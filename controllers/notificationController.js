'use strict';

// [MODIFIKASI] Controller untuk mengelola notifikasi user (In-app notification lintas platform Web, Desktop, Mobile)
const { Notification, Laporan } = require('../models');

/**
 * Mengambil daftar notifikasi milik user yang sedang login
 */
const getNotifications = async (req, res) => {
  try {
    const id_nik = req.user.id_nik;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const whereClause = { id_nik };
    if (req.query.is_read !== undefined) {
      whereClause.is_read = req.query.is_read === 'true';
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: Laporan,
          as: 'laporan',
          paranoid: false, // [MODIFIKASI] Sertakan data laporan soft-delete agar nomor & judul tetap tampil pada notifikasi penghapusan
          attributes: ['id_laporan', 'nomor_laporan', 'status', 'perihal', 'deleted_at']
        }
      ]
    });

    const unreadCount = await Notification.count({
      where: {
        id_nik,
        is_read: false
      }
    });

    return res.status(200).json({
      status: 'success',
      data: {
        notifications: rows,
        unread_count: unreadCount,
        pagination: {
          total: count,
          page,
          limit,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getNotifications:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data notifikasi'
    });
  }
};

/**
 * Mengambil jumlah notifikasi yang belum dibaca (untuk badge ringan)
 */
const getUnreadCount = async (req, res) => {
  try {
    const id_nik = req.user.id_nik;
    const unreadCount = await Notification.count({
      where: {
        id_nik,
        is_read: false
      }
    });

    return res.status(200).json({
      status: 'success',
      data: {
        unread_count: unreadCount
      }
    });
  } catch (error) {
    console.error('Error getUnreadCount:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menghitung notifikasi belum dibaca'
    });
  }
};

/**
 * Menandai satu notifikasi sebagai telah dibaca
 */
const markAsRead = async (req, res) => {
  try {
    const id_nik = req.user.id_nik;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id_notification: id,
        id_nik
      }
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notifikasi tidak ditemukan'
      });
    }

    await notification.update({ is_read: true });

    return res.status(200).json({
      status: 'success',
      message: 'Notifikasi berhasil ditandai telah dibaca',
      data: notification
    });
  } catch (error) {
    console.error('Error markAsRead:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status notifikasi'
    });
  }
};

/**
 * Menandai semua notifikasi milik user sebagai telah dibaca
 */
const markAllAsRead = async (req, res) => {
  try {
    const id_nik = req.user.id_nik;

    await Notification.update(
      { is_read: true },
      {
        where: {
          id_nik,
          is_read: false
        }
      }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Semua notifikasi berhasil ditandai telah dibaca'
    });
  } catch (error) {
    console.error('Error markAllAsRead:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui semua notifikasi'
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
