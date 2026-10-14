export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    path: req.originalUrl
  });
};

export const errorHandler = (error, req, res, next) => {
  console.error('Unhandled error:', error.message);

  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error'
  });
};
