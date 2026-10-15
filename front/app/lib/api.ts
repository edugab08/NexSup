// ─── Configuração central da API ──────────────────────────────────────────────
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ─── Tipos alinhados com o back-end (Prisma) ─────────────────────────────────
export type UserRole = 'USER' | 'AGENT' | 'ADMIN';
export type TicketStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO' | 'REABERTO';
export type TicketPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  active?: boolean;
  createdAt: string;
  _count?: { tickets: number; assignedTickets: number };
};

export type Department = {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  _count?: { tickets: number; members: number; categories: number };
  members?: { user: Pick<User, 'id' | 'name' | 'email' | 'role'> }[];
  categories?: Category[];
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  department?: { id: string; name: string };
};

export type Tag = { id: string; name: string; color: string };

export type Ticket = {
  id: string;
  number: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  firstReplyAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  slaResponseDue?: string;
  slaResolutionDue?: string;
  slaResponseBreached?: boolean;
  slaResolutionBreached?: boolean;
  userId: string;
  assignedTo?: string;
  departmentId?: string;
  categoryId?: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  assigned?: Pick<User, 'id' | 'name'>;
  department?: { id: string; name: string };
  category?: { id: string; name: string };
  tags?: { tag: Tag }[];
  rating?: Rating | null;
  _count?: { comments: number; attachments: number };
};

export type Comment = {
  id: string;
  content: string;
  internal?: boolean;
  createdAt: string;
  ticketId?: string;
  author: Pick<User, 'id' | 'name'> & { role?: UserRole };
};

export type Rating = { id: string; score: number; comment?: string; createdAt: string };

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
};

export type KbArticle = {
  id: string;
  title: string;
  content: string;
  published: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  author?: Pick<User, 'id' | 'name'>;
};

export type SlaPolicy = {
  id: string;
  priority: TicketPriority;
  responseTimeMins: number;
  resolutionTimeMins: number;
  active: boolean;
};

export type AuthResponse = { access_token: string; user: User };

export type TicketStats = {
  total: number;
  aberto: number;
  emAndamento: number;
  aguardando: number;
  resolvido: number;
  fechado: number;
  reaberto: number;
  slaResponseBreaches: number;
  slaResolutionBreaches: number;
  avgRating: number | null;
  totalRatings: number;
};

// ─── Cliente HTTP com injeção automática de JWT ───────────────────────────────
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nexsupport_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  // 401 em rotas de autenticação (ex.: senha incorreta no login) NÃO é sessão
  // expirada: deixamos o erro seguir para a tela, que exibe o toast. Só tratamos
  // como "sessão expirada" quando já havia um token e a rota é protegida.
  const ehRotaDeAuth = path.startsWith('/auth/');
  if (response.status === 401 && !ehRotaDeAuth) {
    localStorage.removeItem('nexsupport_token');
    localStorage.removeItem('nexsupport_user');
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    const msg = Array.isArray(erro.message) ? erro.message.join(', ') : erro.message;
    throw new Error(msg || `Erro ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};

// ─── Tickets ──────────────────────────────────────────────────────────────────
export const ticketsApi = {
  listar: (filtros?: Record<string, string>) => {
    const params = filtros && Object.keys(filtros).length ? '?' + new URLSearchParams(filtros).toString() : '';
    return request<Ticket[]>(`/tickets${params}`);
  },
  buscar: (id: string) => request<Ticket>(`/tickets/${id}`),
  criar: (data: { title: string; description: string; priority?: TicketPriority; departmentId?: string; categoryId?: string }) =>
    request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: string, data: Partial<Ticket>) =>
    request<Ticket>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  assumir: (id: string) => request<Ticket>(`/tickets/${id}/assign-to-me`, { method: 'POST' }),
  remover: (id: string) => request<{ message: string }>(`/tickets/${id}`, { method: 'DELETE' }),
  stats: () => request<TicketStats>('/tickets/stats'),
  listarComentarios: (id: string) => request<Comment[]>(`/tickets/${id}/comments`),
  comentar: (id: string, content: string, internal = false) =>
    request<Comment>(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ content, internal }) }),
  avaliar: (id: string, score: number, comment?: string) =>
    request<Rating>(`/tickets/${id}/rating`, { method: 'POST', body: JSON.stringify({ score, comment }) }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  listar: () => request<User[]>('/users'),
  agentes: () => request<User[]>('/users/agents'),
  criar: (data: { name: string; email: string; password: string; role?: UserRole }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  buscar: (id: string) => request<User>(`/users/${id}`),
  atualizar: (id: string, data: Partial<User>) =>
    request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remover: (id: string) => request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
};

// ─── Departments ────────────────────────────────────────────────────────────
export const departmentsApi = {
  listar: () => request<Department[]>('/departments'),
  buscar: (id: string) => request<Department>(`/departments/${id}`),
  criar: (name: string, description?: string) =>
    request<Department>('/departments', { method: 'POST', body: JSON.stringify({ name, description }) }),
  atualizar: (id: string, data: Partial<Department>) =>
    request<Department>(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remover: (id: string) => request<{ message: string }>(`/departments/${id}`, { method: 'DELETE' }),
  addMembro: (id: string, userId: string) =>
    request(`/departments/${id}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removerMembro: (id: string, userId: string) =>
    request(`/departments/${id}/members/${userId}`, { method: 'DELETE' }),
};

// ─── Categories ─────────────────────────────────────────────────────────────
export const categoriesApi = {
  listar: (departmentId?: string) =>
    request<Category[]>(`/categories${departmentId ? '?departmentId=' + departmentId : ''}`),
  criar: (name: string, description?: string, departmentId?: string) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify({ name, description, departmentId }) }),
  remover: (id: string) => request<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),
};

// ─── Tags ─────────────────────────────────────────────────────────────────────
export const tagsApi = {
  listar: () => request<Tag[]>('/tags'),
  criar: (name: string, color?: string) =>
    request<Tag>('/tags', { method: 'POST', body: JSON.stringify({ name, color }) }),
};

// ─── Notifications ──────────────────────────────────────────────────────────
export const notificationsApi = {
  listar: (unread = false) => request<Notification[]>(`/notifications${unread ? '?unread=true' : ''}`),
  contarNaoLidas: () => request<{ count: number }>('/notifications/unread-count'),
  marcarLida: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  marcarTodasLidas: () => request('/notifications/read-all', { method: 'PATCH' }),
};

// ─── Knowledge Base ───────────────────────────────────────────────────────────
export const kbApi = {
  listar: (q?: string) => request<KbArticle[]>(`/kb${q ? '?q=' + encodeURIComponent(q) : ''}`),
  buscar: (id: string) => request<KbArticle>(`/kb/${id}`),
  criar: (title: string, content: string, published = false) =>
    request<KbArticle>('/kb', { method: 'POST', body: JSON.stringify({ title, content, published }) }),
  atualizar: (id: string, data: Partial<KbArticle>) =>
    request<KbArticle>(`/kb/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remover: (id: string) => request<{ message: string }>(`/kb/${id}`, { method: 'DELETE' }),
};

// ─── SLA ──────────────────────────────────────────────────────────────────────
export const slaApi = {
  listar: () => request<SlaPolicy[]>('/sla/policies'),
  salvar: (priority: string, responseTimeMins: number, resolutionTimeMins: number) =>
    request<SlaPolicy>('/sla/policies', { method: 'PUT', body: JSON.stringify({ priority, responseTimeMins, resolutionTimeMins }) }),
};
