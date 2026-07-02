// Bu dosya eski admin doğrulama sistemine aitti ve içinde gömülü şifre barındırıyordu.
// Admin girişi artık backend'deki /api/login üzerinden JWT ile yapılıyor.
// Dosya, eski importlar kırılmasın diye zararsız stub olarak tutuluyor.

export const verifyAdminLogin = async (_args?: unknown) => {
  return { ok: false as const, error: "deprecated: use /api/login" };
};

export const changeAdminPassword = async (_args?: unknown) => {
  return { ok: false as const, error: "deprecated: use /api/login" };
};
