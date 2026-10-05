import axios from 'axios';
import type {
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  Tag,
  CreateTagDto,
  UpdateTagDto,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000, // 45s timeout to handle Render cold start gracefully
});

// ==================== IN-MEMORY CLIENT CACHE ====================
// Provides instant 0ms transitions across tabs while guaranteeing accuracy
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

async function cachedGet<T>(endpoint: string, ttlMs: number = DEFAULT_TTL_MS): Promise<T> {
  const cached = memoryCache.get(endpoint) as CacheEntry<T> | undefined;
  const now = Date.now();

  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  const response = await api.get<T>(endpoint);
  memoryCache.set(endpoint, { data: response.data, timestamp: now });
  return response.data;
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}

// Silent keepalive/warmup ping for free-tier backend cold starts
export function warmupBackend(): void {
  api.get('/departments').catch(() => {
    // Silent catch for background ping
  });
}

// ==================== DEPARTMENTS ====================
export const departmentApi = {
  getAll: () => cachedGet<Department[]>('/departments'),
  getById: (id: number) => cachedGet<Department>(`/departments/${id}`),
  search: (name: string) =>
    cachedGet<Department[]>(`/departments/search?name=${encodeURIComponent(name)}`, 30000),
  create: async (dto: CreateDepartmentDto) => {
    const res = await api.post<Department>('/departments', dto);
    invalidateCache('/departments');
    invalidateCache('/projects');
    return res.data;
  },
  update: async (id: number, dto: UpdateDepartmentDto) => {
    const res = await api.put<Department>(`/departments/${id}`, dto);
    invalidateCache('/departments');
    invalidateCache('/projects');
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/departments/${id}`);
    invalidateCache('/departments');
    invalidateCache('/projects');
    return res.status === 204;
  },
};

// ==================== PROJECTS ====================
export const projectApi = {
  getAll: (params?: { name?: string; status?: number | ''; departmentId?: number | '' }) => {
    const searchParams = new URLSearchParams();
    if (params?.name) searchParams.append('name', params.name);
    if (params?.status !== undefined && params?.status !== '')
      searchParams.append('status', String(params.status));
    if (params?.departmentId !== undefined && params?.departmentId !== '')
      searchParams.append('departmentId', String(params.departmentId));
    const query = searchParams.toString();
    const endpoint = query ? `/projects/search?${query}` : '/projects';
    return cachedGet<Project[]>(endpoint, query ? 30000 : DEFAULT_TTL_MS);
  },
  getById: (id: number) => cachedGet<Project>(`/projects/${id}`),
  getByDepartmentId: (departmentId: number) =>
    cachedGet<Project[]>(`/projects/department/${departmentId}`),
  create: async (dto: CreateProjectDto) => {
    const res = await api.post<Project>('/projects', dto);
    invalidateCache('/projects');
    invalidateCache('/tasks');
    return res.data;
  },
  update: async (id: number, dto: UpdateProjectDto) => {
    const res = await api.put<Project>(`/projects/${id}`, dto);
    invalidateCache('/projects');
    invalidateCache('/tasks');
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/projects/${id}`);
    invalidateCache('/projects');
    invalidateCache('/tasks');
    return res.status === 204;
  },
};

// ==================== TASKS ====================
export const taskApi = {
  getAll: (params?: {
    title?: string;
    status?: number | '';
    priority?: number | '';
    projectId?: number | '';
    tagId?: number | '';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.title) searchParams.append('title', params.title);
    if (params?.status !== undefined && params?.status !== '')
      searchParams.append('status', String(params.status));
    if (params?.priority !== undefined && params?.priority !== '')
      searchParams.append('priority', String(params.priority));
    if (params?.projectId !== undefined && params?.projectId !== '')
      searchParams.append('projectId', String(params.projectId));
    if (params?.tagId !== undefined && params?.tagId !== '')
      searchParams.append('tagId', String(params.tagId));
    const query = searchParams.toString();
    const endpoint = query ? `/tasks/search?${query}` : '/tasks';
    return cachedGet<Task[]>(endpoint, query ? 30000 : DEFAULT_TTL_MS);
  },
  getById: (id: number) => cachedGet<Task>(`/tasks/${id}`),
  getByProjectId: (projectId: number) => cachedGet<Task[]>(`/tasks/project/${projectId}`),
  create: async (dto: CreateTaskDto) => {
    const res = await api.post<Task>('/tasks', dto);
    invalidateCache('/tasks');
    invalidateCache('/projects');
    return res.data;
  },
  update: async (id: number, dto: UpdateTaskDto) => {
    const res = await api.put<Task>(`/tasks/${id}`, dto);
    invalidateCache('/tasks');
    invalidateCache('/projects');
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/tasks/${id}`);
    invalidateCache('/tasks');
    invalidateCache('/projects');
    return res.status === 204;
  },
};

// ==================== TAGS ====================
export const tagApi = {
  getAll: () => cachedGet<Tag[]>('/tags'),
  getById: (id: number) => cachedGet<Tag>(`/tags/${id}`),
  create: async (dto: CreateTagDto) => {
    const res = await api.post<Tag>('/tags', dto);
    invalidateCache('/tags');
    invalidateCache('/tasks');
    return res.data;
  },
  update: async (id: number, dto: UpdateTagDto) => {
    const res = await api.put<Tag>(`/tags/${id}`, dto);
    invalidateCache('/tags');
    invalidateCache('/tasks');
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/tags/${id}`);
    invalidateCache('/tags');
    invalidateCache('/tasks');
    return res.status === 204;
  },
};
