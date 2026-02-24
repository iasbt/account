export const getHealth = (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "account-backend",
    version: "1.8.4"
  });
};
