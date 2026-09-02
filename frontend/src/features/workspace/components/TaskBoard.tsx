import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { workspaceMessages } from '@/constants/messages/workspace';
import { toast } from 'sonner';
import { useGroupTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useWorkspace';
import { createTaskSchema } from '../schemas/workspace.schema';
import type { TaskItem, TaskStatus, GroupRole } from '../types/workspace.types';

interface TaskBoardProps {
  groupId: string;
  userRole?: GroupRole;
  currentUserId?: string;
  members?: Array<{ id: string; name: string }>;
}

const KANBAN_COLUMNS: Array<{ status: TaskStatus; title: string; emoji: string }> = [
  { status: 'TODO', title: workspaceMessages.kanban.columnTodo, emoji: '📋' },
  { status: 'IN_PROGRESS', title: workspaceMessages.kanban.columnInProgress, emoji: '🚧' },
  { status: 'DONE', title: workspaceMessages.kanban.columnDone, emoji: '✅' },
];

export const TaskBoard: React.FC<TaskBoardProps> = ({
  groupId,
  userRole = 'MEMBER',
  currentUserId,
  members = [],
}) => {
  const { data: rawTasks, isLoading, isError, refetch } = useGroupTasks(groupId);
  const tasks: TaskItem[] = Array.isArray(rawTasks) ? rawTasks : (rawTasks as any)?.data || [];
  const createTask = useCreateTask(groupId);
  const updateTask = useUpdateTask(groupId);
  const deleteTask = useDeleteTask(groupId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const isLeader = userRole === 'LEADER';

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validation = createTaskSchema.safeParse({
      title: taskTitle,
      assignee_id: assigneeId || null,
    });

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Dữ liệu không hợp lệ.');
      return;
    }

    try {
      await createTask.mutateAsync({
        title: taskTitle.trim(),
        status: 'TODO',
        assignee_id: assigneeId || null,
      });
      toast.success(workspaceMessages.kanban.createSuccess);
      setTaskTitle('');
      setAssigneeId('');
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || workspaceMessages.error.createTaskFailed);
    }
  };

  const handleMoveTask = async (task: TaskItem, newStatus: TaskStatus) => {
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        data: { status: newStatus },
      });
      toast.success(workspaceMessages.kanban.updateSuccess);
    } catch (err: any) {
      toast.error(err.message || workspaceMessages.error.updateTaskFailed);
    }
  };

  const handleDeleteTask = async (taskId: string | number) => {
    if (!window.confirm(workspaceMessages.kanban.confirmDelete)) return;
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success(workspaceMessages.kanban.deleteSuccess);
    } catch (err: any) {
      toast.error(err.message || workspaceMessages.error.deleteTaskFailed);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-busy="true">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        type="error"
        title="Không thể tải bảng công việc"
        description={workspaceMessages.error.fetchFailed}
        actionLabel="Thử lại"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-4 min-h-0">
      {/* Header & Create Action */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{workspaceMessages.kanban.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{workspaceMessages.autoRefreshInfo}</p>
        </div>

        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4"
        >
          {workspaceMessages.kanban.createTaskBtn}
        </Button>
      </div>

      {/* Kanban 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0 overflow-x-auto">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);

          return (
            <div key={col.status} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 flex flex-col min-h-0">
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <span aria-hidden="true">{col.emoji}</span>
                  <span>{col.title}</span>
                </h3>
                <span className="text-xs font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full font-mono">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    {workspaceMessages.empty.noTasksTitle}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const canDelete = isLeader || task.created_by === currentUserId;

                    return (
                      <div
                        key={task.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-gray-400 hover:text-red-600 p-1 text-xs transition-colors"
                              aria-label={`Xóa task ${task.title}`}
                            >
                              🗑
                            </button>
                          )}
                        </div>

                        {/* Assignee Badge */}
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                          <span className="truncate max-w-[150px]">
                            👤 {task.assignee_name || workspaceMessages.kanban.unassigned}
                          </span>

                          {/* Shift Status Arrows */}
                          <div className="flex items-center gap-1">
                            {col.status !== 'TODO' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMoveTask(task, col.status === 'DONE' ? 'IN_PROGRESS' : 'TODO')
                                }
                                className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold transition-colors"
                                aria-label={`Chuyển task ${task.title} sang lùi lại`}
                              >
                                ⬅️
                              </button>
                            )}

                            {col.status !== 'DONE' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMoveTask(task, col.status === 'TODO' ? 'IN_PROGRESS' : 'DONE')
                                }
                                className="px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold transition-colors"
                                aria-label={`Chuyển task ${task.title} sang tiếp theo`}
                              >
                                ➡️
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={workspaceMessages.kanban.modalTitle}
        className="max-w-md"
      >
        <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
          {formError && (
            <div role="alert" className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md">
              ⚠️ {formError}
            </div>
          )}

          <div>
            <label htmlFor="task-title-input" className="block text-xs font-semibold text-gray-700 mb-1">
              {workspaceMessages.kanban.taskTitleLabel}
            </label>
            <input
              id="task-title-input"
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder={workspaceMessages.kanban.taskTitlePlaceholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="task-assignee-select" className="block text-xs font-semibold text-gray-700 mb-1">
              {workspaceMessages.kanban.assigneeLabel}
            </label>
            <select
              id="task-assignee-select"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{workspaceMessages.kanban.selectAssignee}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createTask.isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {createTask.isPending ? 'Đang tạo...' : 'Tạo task'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
