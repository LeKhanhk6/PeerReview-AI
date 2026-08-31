import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { workspaceMessages } from '@/constants/messages/workspace';
import { toast } from 'sonner';
import { useGroupDiscussions, useCreateDiscussion } from '../hooks/useWorkspace';
import { createDiscussionSchema } from '../schemas/workspace.schema';

interface DiscussionFeedProps {
  groupId: string;
}

export const DiscussionFeed: React.FC<DiscussionFeedProps> = ({ groupId }) => {
  const { data: rawMessages, isLoading, isError, refetch } = useGroupDiscussions(groupId);
  const messages: any[] = Array.isArray(rawMessages) ? rawMessages : (rawMessages as any)?.data || [];
  const createDiscussion = useCreateDiscussion(groupId);

  const [inputMessage, setInputMessage] = useState('');
  const [formError, setFormError] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validation = createDiscussionSchema.safeParse({ message: inputMessage });
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Nội dung tin nhắn không hợp lệ.');
      return;
    }

    try {
      await createDiscussion.mutateAsync(inputMessage.trim());
      toast.success(workspaceMessages.discussions.sendSuccess);
      setInputMessage('');
    } catch (err: any) {
      toast.error(err.message || workspaceMessages.error.sendMessageFailed);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        type="error"
        title="Không thể tải tin nhắn thảo luận"
        description={workspaceMessages.error.fetchFailed}
        actionLabel="Thử lại"
        onAction={() => refetch()}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[550px]">
      {/* Header Bar */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            💬 {workspaceMessages.discussions.title}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{workspaceMessages.autoRefreshInfo}</p>
        </div>

        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
          {messages.length} tin nhắn
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
        {messages.length === 0 ? (
          <EmptyState
            type="no_data"
            title={workspaceMessages.discussions.emptyTitle}
            description={workspaceMessages.discussions.emptyDesc}
          />
        ) : (
          messages.map((msg) => {
            const dateStr = new Date(msg.created_at).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
            });

            return (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                  {(msg.user_name || 'U').charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 bg-white border border-gray-200 p-3 rounded-2xl shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">{msg.user_name || 'Thành viên'}</span>
                    <span className="text-gray-400 font-mono">{dateStr}</span>
                  </div>

                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Send Message Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white space-y-2">
        {formError && (
          <p role="alert" className="text-xs text-red-600 font-medium">
            ⚠️ {formError}
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={workspaceMessages.discussions.placeholder}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <Button
            type="submit"
            disabled={createDiscussion.isPending || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-sm"
          >
            {createDiscussion.isPending ? 'Đang gửi...' : workspaceMessages.discussions.sendBtn}
          </Button>
        </div>
      </form>
    </div>
  );
};
