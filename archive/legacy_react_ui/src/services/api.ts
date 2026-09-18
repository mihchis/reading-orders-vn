export interface ReadingOrderItem {
  id: number;
  slug: string;
  title: string;
  universe_id: number;
  universe_slug: string;
  universe_name: string;
  accent_color: string;
  category_id?: number;
  category_slug?: string;
  category_name?: string;
  description: string;
  year_published: string;
  featured_characters: string;
  previous_event_title?: string;
  previous_event_slug?: string;
  next_event_title?: string;
  next_event_slug?: string;
  cover_image?: string;
  timeline_order?: number;
  issue_count: number;
  issues?: IssueItem[];
}

export interface IssueItem {
  id: number;
  reading_order_id: number;
  tab_type: 'single' | 'tpb';
  title: string;
  issue_type: 'ongoing' | 'limited' | 'oneshot' | 'comment';
  year?: string;
  note?: string;
  is_noncanon?: number | boolean;
  read_url?: string;
  sort_order: number;
}

export interface Universe {
  id: number;
  slug: string;
  name: string;
  accent_color: string;
  description: string;
  categories: {
    id: number;
    slug: string;
    name: string;
    description: string;
  }[];
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Quản lý xác thực người dùng & tiến độ đọc
  auth: {
    register: async (data: { username: string; password: string; display_name?: string }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    login: async (data: { username: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    me: async () => {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
      });
      return res.json();
    },
    getProgress: async (orderId: number) => {
      const res = await fetch(`/api/auth/progress/${orderId}`, {
        headers: getAuthHeaders(),
      });
      return res.json();
    },
    toggleProgress: async (orderId: number, issueId: number) => {
      const res = await fetch(`/api/auth/progress/${orderId}/toggle`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ issueId }),
      });
      return res.json();
    },
    markAllProgress: async (orderId: number, markAllRead: boolean, issueIds: number[]) => {
      const res = await fetch(`/api/auth/progress/${orderId}/mark-all`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ markAllRead, issueIds }),
      });
      return res.json();
    }
  },

  // Lấy danh sách thứ tự đọc
  getReadingOrders: async (params?: { universe?: string; category?: string; letter?: string; search?: string; sort?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.universe) searchParams.set('universe', params.universe);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.letter) searchParams.set('letter', params.letter);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);

    const res = await fetch(`/api/reading-orders?${searchParams.toString()}`);
    return res.json();
  },

  // Lấy chi tiết 1 thứ tự đọc cùng danh sách tập
  getReadingOrderDetail: async (slug: string) => {
    const res = await fetch(`/api/reading-orders/${slug}`);
    return res.json();
  },

  // Lấy danh sách vũ trụ và danh mục
  getUniverses: async () => {
    const res = await fetch('/api/universes');
    return res.json();
  },

  // Lấy danh sách FAQs
  getFaqs: async () => {
    const res = await fetch('/api/faqs');
    return res.json();
  },

  // Tìm kiếm toàn cục
  search: async (q: string) => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    return res.json();
  },

  // Admin APIs
  admin: {
    getStats: async () => {
      const res = await fetch('/api/admin/stats', { headers: getAuthHeaders() });
      return res.json();
    },
    createReadingOrder: async (data: any) => {
      const res = await fetch('/api/admin/reading-orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
    updateReadingOrder: async (id: number, data: any) => {
      const res = await fetch(`/api/admin/reading-orders/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
    deleteReadingOrder: async (id: number) => {
      const res = await fetch(`/api/admin/reading-orders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.json();
    },
    addIssues: async (orderId: number, issues: any[]) => {
      const res = await fetch(`/api/admin/reading-orders/${orderId}/issues`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ issues }),
      });
      return res.json();
    },
    updateIssue: async (id: number, data: any) => {
      const res = await fetch(`/api/admin/issues/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
    deleteIssue: async (id: number) => {
      const res = await fetch(`/api/admin/issues/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return res.json();
    },
    reorderIssues: async (orderId: number, issueOrders: { id: number; sort_order: number }[]) => {
      const res = await fetch(`/api/admin/reading-orders/${orderId}/reorder-issues`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ issue_orders: issueOrders }),
      });
      return res.json();
    },
    parseHtml: async (htmlContent: string, fileName?: string) => {
      const res = await fetch('/api/admin/parse-html', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ htmlContent, fileName }),
      });
      return res.json();
    },
    importReadingOrder: async (orderData: any, deleteSourceFile?: boolean, fileName?: string) => {
      const res = await fetch('/api/admin/import-reading-order', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderData, deleteSourceFile, fileName }),
      });
      return res.json();
    }
  }
};
