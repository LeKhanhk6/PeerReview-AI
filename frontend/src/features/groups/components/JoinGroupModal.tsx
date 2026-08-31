import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { groupsApi } from '../api/groups.api';
import { toast } from 'sonner';

interface JoinGroupModalProps {
  open: boolean;
  onClose: () => void;
  classId?: string;
  className?: string;
  onSuccess?: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  open,
  onClose,
  classId,
  className = 'Lớp học',
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  const { data: groups = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['class-groups', classId],
    queryFn: () => groupsApi.getGroups(classId || ''),
    enabled: open && Boolean(classId),
  });

  const joinMutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.joinGroup(groupId),
    onMutate: (groupId) => setJoiningGroupId(groupId),
    onSuccess: () => {
      toast.success('🎉 Bạn đã tham gia nhóm thành công!');
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['class-groups'] });
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || err?.message || '';
      if (errMsg.includes('GROUP_FULL')) {
        toast.error('⚠️ Nhóm này đã đủ số lượng thành viên tối đa (6 sinh viên/nhóm).');
      } else if (errMsg.includes('already belongs')) {
        toast.error('⚠️ Bạn đã thuộc về một nhóm khác trong lớp học này.');
      } else {
        toast.error(errMsg || 'Không thể tham gia nhóm. Vui lòng thử lại.');
      }
    },
    onSettled: () => setJoiningGroupId(null),
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`🚀 Tham gia nhóm - ${className}`}
      className="max-w-xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-600">
          Hãy chọn một nhóm còn chỗ trống để tham gia làm việc nhóm và nộp bài tập trong lớp học này.
        </p>

        {isLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : isError ? (
          <EmptyState
            type="error"
            title="Không thể tải danh sách nhóm"
            description="Đã xảy ra lỗi khi lấy danh sách nhóm của lớp."
            actionLabel="Thử lại"
            onAction={() => refetch()}
          />
        ) : groups.length === 0 ? (
          <EmptyState
            type="no_data"
            title="Chưa có nhóm nào trong lớp"
            description="Giảng viên chưa tạo nhóm cho lớp học này. Vui lòng chờ Giảng viên phân nhóm."
          />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {groups.map((group) => {
              const memberCount = group.member_count ?? group.members?.length ?? 0;
              const isFull = memberCount >= 6;

              return (
                <div
                  key={group.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{group.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isFull
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isFull ? '🔴 Đã đủ nhóm (6/6)' : `🟢 Còn chỗ (${memberCount}/6 thành viên)`}
                      </span>
                    </div>

                    {group.members && group.members.length > 0 && (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        Thành viên: {group.members.map((m: any) => m.full_name || m.name || m.email).join(', ')}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isFull || joinMutation.isPending}
                    onClick={() => joinMutation.mutate(group.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                  >
                    {joiningGroupId === group.id
                      ? 'Đang tham gia...'
                      : isFull
                      ? 'Nhóm đã đầy'
                      : 'Tham gia nhóm'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-gray-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
