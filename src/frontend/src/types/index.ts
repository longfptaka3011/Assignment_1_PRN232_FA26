// Department Types
export interface Department {
  departmentId: number;
  departmentName: string;
  departmentDescription: string;
  isActive: boolean;
  projects?: Project[];
}

export interface CreateDepartmentDto {
  departmentName: string;
  departmentDescription: string;
}

export interface UpdateDepartmentDto {
  departmentName: string;
  departmentDescription: string;
}

// Project Types
export interface Project {
  projectId: number;
  projectName: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: number;
  statusName: string;
  departmentId: number;
  departmentName: string;
  isActive: boolean;
  createdDate: string;
  tasks?: Task[];
}

export interface CreateProjectDto {
  projectName: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: number;
  departmentId: number;
}

export interface UpdateProjectDto {
  projectName: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: number;
  departmentId: number;
}

// Task Types
export interface Task {
  taskId: number;
  title: string;
  description?: string;
  status: number;
  statusName: string;
  priority: number;
  priorityName: string;
  dueDate?: string;
  projectId: number;
  projectName?: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate?: string;
  tags?: Tag[];
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status: number;
  priority: number;
  dueDate?: string;
  projectId: number;
  tagIds?: number[];
}

export interface UpdateTaskDto {
  title: string;
  description?: string;
  status: number;
  priority: number;
  dueDate?: string;
  projectId: number;
  tagIds?: number[];
}

// Tag Types
export interface Tag {
  tagId: number;
  tagName: string;
  color?: string;
}

export interface CreateTagDto {
  tagName: string;
  color?: string;
}

export interface UpdateTagDto {
  tagName: string;
  color?: string;
}
