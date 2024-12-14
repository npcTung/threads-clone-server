const notFound = (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  res.status(404);
  next(err);
};

const errHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return res
    .status(statusCode)
    .json({ success: false, mes: err?.message?.replaceAll(`\"`, "") });
};

module.exports = { notFound, errHandler };
