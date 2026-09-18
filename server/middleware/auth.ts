import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../database/supabase';

export const JWT_SECRET = process.env.JWT_SECRET || 'reading_orders_secret_key_2026';

export interface AuthUser {
  id: string | number;
  username: string;
  display_name: string;
  role: 'admin' | 'user';
}

export interface AuthRequest extends Request {
  admin?: AuthUser;
  user?: AuthUser;
}

// Middleware cho các route yêu cầu đăng nhập (Admin hoặc Độc giả)
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện tính năng này' });
    return;
  }

  const token = authHeader.split(' ')[1];

  // 1. Kiểm tra qua Supabase Auth
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data?.user) {
      const u = data.user;
      const role = (u.user_metadata?.role || (u.user_metadata?.username === 'admin' ? 'admin' : 'user')) as 'admin' | 'user';
      const authUser: AuthUser = {
        id: u.id,
        username: u.user_metadata?.username || u.email?.split('@')[0] || 'reader',
        display_name: u.user_metadata?.display_name || 'Độc giả',
        role
      };
      req.user = authUser;
      if (role === 'admin') {
        req.admin = authUser;
      }
      return next();
    }
  } catch (e) {
    // tiếp tục fallback
  }

  // 2. Fallback cho JWT cũ / local token
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    if (decoded.role === 'admin') {
      req.admin = decoded;
    }
    return next();
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
export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        const u = data.user;
        const role = (u.user_metadata?.role || (u.user_metadata?.username === 'admin' ? 'admin' : 'user')) as 'admin' | 'user';
        const authUser: AuthUser = {
          id: u.id,
          username: u.user_metadata?.username || u.email?.split('@')[0] || 'reader',
          display_name: u.user_metadata?.display_name || 'Độc giả',
          role
        };
        req.user = authUser;
        if (role === 'admin') {
          req.admin = authUser;
        }
        return next();
      }
    } catch (e) {}

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      if (decoded.role === 'admin') {
        req.admin = decoded;
      }
    } catch (e) {}
  }
  next();
}
