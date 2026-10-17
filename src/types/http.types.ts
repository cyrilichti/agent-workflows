import type { TaskService } from '../services/task.service.ts';

export type TaskControllerOptions = {
  taskExecution: Pick<TaskService, 'getHealth' | 'executeTask'>;
};
