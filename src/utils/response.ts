import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ResponseUtils {
  static success<T>(res: Response, data?: T, message?: string): Response {
    return res.json({
      success: true,
      data,
      message,
    });
  }

  static successWithPagination<T>(
    res: Response,
    data: T,
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message?: string
  ): Response {
    return res.json({
      success: true,
      data,
      pagination,
      message,
    });
  }

  static error(res: Response, message: string, status: number = 400): Response {
    return res.status(status).json({
      success: false,
      error: message,
    });
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return res.status(401).json({
      success: false,
      error: message,
    });
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return res.status(403).json({
      success: false,
      error: message,
    });
  }

  static notFound(res: Response, message: string = 'Not Found'): Response {
    return res.status(404).json({
      success: false,
      error: message,
    });
  }

  static serverError(res: Response, message: string = 'Internal Server Error'): Response {
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}

export const handleApiError = (res: Response, error: Error | unknown): Response => {
  console.error('API Error:', error);
  
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  if (errorMessage === 'Unauthorized') {
    return ResponseUtils.unauthorized(res);
  }
  
  if (errorMessage === 'Forbidden') {
    return ResponseUtils.forbidden(res);
  }
  
  if (errorMessage === 'Not Found') {
    return ResponseUtils.notFound(res);
  }
  
  return ResponseUtils.serverError(res, errorMessage);
};