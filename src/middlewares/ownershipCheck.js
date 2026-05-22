'use strict';

const ownershipCheck = (req, res, next) => {
  const paramId = req.params.id || req.params.user_id;
  if (paramId && req.user && paramId !== String(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Anda tidak memiliki izin untuk resource ini.',
    });
  }
  next();
};

module.exports = ownershipCheck;
