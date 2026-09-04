import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { synthesisMessages } from '@/constants/messages/synthesis';
import type { SummaryItem, TopicCategory } from '../types/synthesis.types';
import { Search, Edit2, Pin, Trash2 } from 'lucide-react';

interface SummaryItemCardProps {
  item: SummaryItem;
  isApproved: boolean;
  isUpdating: boolean;
  onSaveItem: (itemId: string, content: string, note: string, updatedAt: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onOpenSourceReviews: (item: SummaryItem) => void;
}

const getCategoryStyles = (category: TopicCategory) => {
  switch (category) {
    case 'STRENGTH':
      return {
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        label: synthesisMessages.categories.strength,
      };
    case 'WEAKNESS':
      return {
        badgeBg: 'bg-red-100 text-red-800 border-red-200',
        label: synthesisMessages.categories.weakness,
      };
    case 'SUGGESTION':
      return {
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
        label: synthesisMessages.categories.suggestion,
      };
    case 'QUESTION':
      return {
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        label: synthesisMessages.categories.question,
      };
    default:
      return {
        badgeBg: 'bg-gray-100 text-gray-800 border-gray-200',
        label: synthesisMessages.categories.unknown,
      };
  }
};

export const SummaryItemCard: React.FC<SummaryItemCardProps> = ({
  item,
  isApproved,
  isUpdating,
  onSaveItem,
  onDeleteItem,
  onOpenSourceReviews,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [editNote, setEditNote] = useState(item.note || '');

  React.useEffect(() => {
    if (isApproved && isEditing) {
      setIsEditing(false);
    }
  }, [isApproved, isEditing]);

  const styles = getCategoryStyles(item.topic_category);
  const formattedUpdatedAt = item.updated_at
    ? new Date(item.updated_at).toLocaleString('vi-VN')
    : '';


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    try {
      await onSaveItem(item.id, editContent, editNote, item.updated_at);
      setIsEditing(false);
    } catch (error) {
      // Error handled by mutation toast
    }
  };

  const handleCancel = () => {
    setEditContent(item.content);
    setEditNote(item.note || '');
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleteConfirmOpen(false);
    try {
      setIsDeleting(true);
      await onDeleteItem(item.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3 transition-all hover:border-gray-300">
      {/* Header Badges & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Topic / Sentiment Badge */}
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-md border ${styles.badgeBg}`}
          >
            {styles.label}
          </span>

          {/* Mention Frequency */}
          <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full border border-gray-200">
            {item.frequency_count} nhóm đề cập
          </span>

          {/* Teacher Edited Badge & Audit Trail Indicator */}
          {item.is_teacher_edited && (
            <span
              className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 rounded border border-amber-200"
              title={`${synthesisMessages.itemCard.updatedAt} ${formattedUpdatedAt}`}
            >
              {synthesisMessages.itemCard.editedBadge}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Source Reviews Traceability Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenSourceReviews(item)}
            className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          >
            <Search className="w-3.5 h-3.5 mr-1" /> {synthesisMessages.itemCard.viewSourceReviews}
          </Button>

          {/* Edit Button */}
          {!isEditing && (
            <div className="relative group">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isApproved || isUpdating}
                onClick={() => setIsEditing(true)}
                className="text-xs"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> {synthesisMessages.itemCard.editButton}
              </Button>

              {/* Approved Disabled Tooltip */}
              {isApproved && (
                <span className="absolute right-0 -bottom-8 hidden group-hover:block z-10 whitespace-nowrap bg-gray-900 text-white text-[11px] px-2 py-1 rounded shadow-lg">
                  {synthesisMessages.status.approvedTooltip}
                </span>
              )}
            </div>
          )}

          {/* Delete Button */}
          {!isEditing && (
            <div className="relative group">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isApproved || isUpdating || isDeleting}
                onClick={handleDeleteClick}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form OR View Content */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-3 pt-1">
          {/* Main Content Area */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {synthesisMessages.itemCard.contentLabel}
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              maxLength={2000}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={synthesisMessages.itemCard.contentPlaceholder}
            />
          </div>

          {/* Teacher Internal Note */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {synthesisMessages.itemCard.noteLabel}
            </label>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              rows={2}
              maxLength={1000}
              className="w-full px-3 py-2 border border-amber-200 bg-amber-50/50 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder={synthesisMessages.itemCard.notePlaceholder}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isUpdating}
            >
              {synthesisMessages.itemCard.cancelButton}
            </Button>
            <Button type="submit" variant="default" size="sm" isLoading={isUpdating}>
              {synthesisMessages.itemCard.saveButton}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          {/* Main Content Text */}
          <p className="text-sm text-gray-900 leading-relaxed font-medium">{item.content}</p>

          {/* Internal Teacher Note (If present) */}
          {item.note && (
            <div className="bg-amber-50 border-l-2 border-amber-400 p-2.5 rounded-r text-xs text-amber-900 font-medium flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5" /> <strong>Ghi chú Giáo viên:</strong> {item.note}
            </div>
          )}

          {/* Audit Trail Footer */}
          {item.is_teacher_edited && (
            <p className="text-[11px] text-gray-400 italic pt-1">
              {synthesisMessages.itemCard.updatedAt} {formattedUpdatedAt}
            </p>
          )}
        </div>
      )}

      {/* Red Destructive Confirm Dialog for Deletion */}
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa cụm nhận xét"
        description="Bạn có chắc chắn muốn xóa ý này không? Thao tác này không thể hoàn tác."
        isDestructive={true}
      />
    </div>
  );
};
