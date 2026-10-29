const { Users, Unit, Role } = require('../models'); // Import Model

// ... di dalam fungsi login ...
const user = await Users.findOne({
  where: { id_nik: req.body.id_nik },
  include: [
    {
      model: Unit,
      as: 'unitData',
      attributes: ['nama_unit'] // KITA HANYA MENGAMBIL NAMA UNITNYA SAJA
    },
    {
      model: Role,
      as: 'roleData',
      attributes: ['nama_role'] // KITA HANYA MENGAMBIL NAMA ROLENYA SAJA
    }
  ]
});