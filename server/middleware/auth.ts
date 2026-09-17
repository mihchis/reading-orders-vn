import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'reading_orders_secret_key_2026';

export interface AuthUser {
  id: number;
  username: string;
  display_name: string;
  role: 'admin' | 'user';
}

export interface AuthRequest extends Request {
  admin?: AuthUser;
  user?: AuthUser;
}

// Middleware cho các route yêu cầu đăng nhập (Admin hoặc Độc giả)
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện tính năng này' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    if (decoded.role === 'admin') {
      req.admin = decoded;
    }
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
  }
}

// Middleware chỉ dành riêng cho Admin (quản trị, sửa reading orders, issues)
export function adminOnlyMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này' });
      return;
    }
    req.admin = req.user;
    next();
  });
}

// Middleware tùy chọn (nếu có token thì nạp user, không có vẫn tiếp tục)
export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
      if (decoded.role === 'admin') {
        req.admin = decoded;
      }
    } catch (e) {
      // bỏ qua nếu token sai
    }
  }
  next();
}
