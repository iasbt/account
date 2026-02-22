export const verificationCodes = new Map();

export const setVerificationCode = (email, code) => {
  verificationCodes.set(email, { code, expires: Date.now() + 300000 }); // 5 minutes
};

export const getVerificationCode = (email) => {
  return verificationCodes.get(email);
};

export const deleteVerificationCode = (email) => {
  verificationCodes.delete(email);
};
