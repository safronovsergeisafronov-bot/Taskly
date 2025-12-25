
export enum Status {
  TODO = 'К выполнению',
  IN_PROGRESS = 'В работе',
  REVIEW = 'На проверке',
  DONE = 'Готово'
}

export enum Priority {
  LOW = 'Низкий',
  NORMAL = 'Средний',
  HIGH = 'Высокий',
  URGENT = 'Срочно'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  createdAt: number;
}

export type ViewType = 'list' | 'board' | 'calendar' | 'ai';
