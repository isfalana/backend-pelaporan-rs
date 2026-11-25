'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
  Users,
  Unit,
  Role,
  UserSession,
  UserFcmToken,
  sequelize
} = require('../models');

const ACCESS_TOKEN_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const getUserIncludes = () => [
  {
    model: Unit,
    as: 'unit',
    attributes: ['id_unit', 'nama_unit']
  },
  {
    model: Role,
    as: 'role',
    attributes: ['id_role', 'nama_role']
  }
];

// LOGIN
exports.login = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      id_nik,
      password,
      fcm_token,
      device_id,
      platform
    } = req.body;

    if (!id_nik || !password) {
      await transaction.rollback();

      return res.status(400).json({
        status: 'error',
        message: 'id_nik dan password wajib diisi'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET belum dikonfigurasi');
    }

    const user = await Users.findOne({
      where: { id_nik },
      include: getUserIncludes(),
      transaction
    });

    if (!user || !user.password) {
      await transaction.rollback();

      return res.status(401).json({
        status: 'error',
        message: 'NIK atau password salah'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await transaction.rollback();

      return res.status(401).json({
        status: 'error',
        message: 'NIK atau password salah'
      });
    }

    // Identitas sesi
    const jti = crypto.randomUUID();
    const refreshToken = generateRefreshToken();

    const refreshTokenHash = hashToken(refreshToken);

    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    // Access token
    const token = jwt.sign(
      {
        id_nik: user.id_nik,
        nama_karyawan: user.nama_karyawan,
        id_role: user.id_role,
        role: user.role?.nama_role,
        id_unit: user.id_unit,
        unit: user.unit?.nama_unit
      },
      jwtSecret,
      {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        algorithm: 'HS256',
        jwtid: jti
      }
    );

    // Simpan sesi pengguna
    await UserSession.create(
      {
        id_nik: user.id_nik,
        jti,
        refresh_token_hash: refreshTokenHash,
        device_id: device_id || null,
        user_agent: req.get('user-agent') || null,
        ip_address: req.ip || null,
        expires_at: expiresAt
      },
      { transaction }
    );

    // Perbarui waktu login
    user.last_login = new Date();
    await user.save({ transaction });

    // Simpan FCM token pada tabel terpisah
    if (fcm_token) {
      let fcmRecord = await UserFcmToken.findOne({
        where: { fcm_token },
        transaction
      });

      if (fcmRecord) {
        fcmRecord.id_nik = user.id_nik;
        fcmRecord.device_id = device_id || null;
        fcmRecord.platform = platform || null;
        fcmRecord.is_active = true;
        fcmRecord.last_used_at = new Date();

        await fcmRecord.save({ transaction });
      } else {
        await UserFcmToken.create(
          {
            id_nik: user.id_nik,
            fcm_token,
            device_id: device_id || null,
            platform: platform || null,
            is_active: true,
            last_used_at: new Date()
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      token,
      refresh_token: refreshToken,
      expires_in: ACCESS_TOKEN_EXPIRES_IN,
      data: {
        id_nik: user.id_nik,
        nama_karyawan: user.nama_karyawan,
        id_unit: user.id_unit,
        nama_unit: user.unit?.nama_unit || '-',
        id_role: user.id_role,
        nama_role: user.role?.nama_role || 'User'
      }
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error('Error saat login:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan internal server'
    });
  }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: {
        id_nik: req.user.id_nik
      },
      include: getUserIncludes(),
      attributes: {
        exclude: ['password']
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User tidak ditemukan'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: user
    });

  } catch (error) {
    console.error('Error mengambil profil:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil profil pengguna'
    });
  }
};

// UPDATE FCM TOKEN
exports.updateFcmToken = async (req, res) => {
  try {
    const {
      fcm_token,
      device_id,
      platform
    } = req.body;

    if (!fcm_token) {
      return res.status(400).json({
        status: 'error',
        message: 'fcm_token wajib diisi'
      });
    }

    const user = await Users.findByPk(req.user.id_nik);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User tidak ditemukan'
      });
    }

    let fcmRecord = await UserFcmToken.findOne({
      where: { fcm_token }
    });

    if (fcmRecord) {
      fcmRecord.id_nik = user.id_nik;
      fcmRecord.device_id = device_id || null;
      fcmRecord.platform = platform || null;
      fcmRecord.is_active = true;
      fcmRecord.last_used_at = new Date();

      await fcmRecord.save();
    } else {
      fcmRecord = await UserFcmToken.create({
        id_nik: user.id_nik,
        fcm_token,
        device_id: device_id || null,
        platform: platform || null,
        is_active: true,
        last_used_at: new Date()
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'FCM token berhasil diperbarui'
    });

  } catch (error) {
    console.error('Error memperbarui FCM token:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui FCM token'
    });
  }
};

// [MODIFIKASI] Endpoint Reset/Forgot Password untuk pengguna (Login & Profil)
exports.resetPassword = async (req, res) => {
  try {
    const { id_nik, new_password } = req.body;

    if (!id_nik || !id_nik.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'NIK karyawan wajib diisi'
      });
    }

    if (!new_password || typeof new_password !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Kata sandi baru wajib diisi'
      });
    }

    const trimmedPassword = new_password.trim();

    // Validasi syarat password: min 8 karakter, angka, dan simbol
    if (trimmedPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Kata sandi minimal 8 karakter'
      });
    }

    if (!/\d/.test(trimmedPassword)) {
      return res.status(400).json({
        status: 'error',
        message: 'Kata sandi harus mengandung minimal satu angka'
      });
    }

    if (!/[!@#$%^&*(),.?":{}|<>_~+\-=\[\]\\]/.test(trimmedPassword)) {
      return res.status(400).json({
        status: 'error',
        message: 'Kata sandi harus mengandung minimal satu simbol/karakter khusus'
      });
    }

    // Cari user berdasarkan NIK
    const user = await Users.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('id_nik')),
        id_nik.trim().toLowerCase()
      )
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Karyawan dengan NIK tersebut tidak ditemukan'
      });
    }

    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Kata sandi berhasil diubah. Silakan masuk menggunakan kata sandi baru.'
    });

  } catch (error) {
    console.error('Error reset password:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Terjadi kesalahan saat mereset kata sandi'
    });
  }
};