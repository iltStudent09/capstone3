import { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }));

    res.status(400).json({
      error: 'Validation failed',
      details,
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: 'Invalid resource identifier',
    });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  ) {
    const duplicateFields =
      'keyValue' in error && error.keyValue && typeof error.keyValue === 'object'
        ? Object.keys(error.keyValue as Record<string, unknown>)
        : [];

    const fieldLabel = duplicateFields.length > 0 ? duplicateFields.join(', ') : 'resource';

    res.status(409).json({
      error: `${fieldLabel} already exists`,
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
  });
};
