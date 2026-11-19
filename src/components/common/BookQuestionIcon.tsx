import React from 'react';

interface BookQuestionIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/**
 * Icon "Cuốn sách và dấu ?" (Book with Question mark)
 * Đại diện cho tính năng Quản lý câu hỏi theo chủ đề bài học
 */
export const BookQuestionIcon: React.FC<BookQuestionIconProps> = ({
  className = 'w-4 h-4',
  size,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      {/* Thân và gáy cuốn sách (chuẩn Lucide Book) */}
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
      {/* Dấu chấm hỏi bên trong cuốn sách (?) */}
      <path d="M9.8 7.8a2.2 2.2 0 0 1 4.2.7c0 1.2-1.8 1.6-1.8 2.5" />
      <path d="M12 13.5h.01" />
    </svg>
  );
};

export default BookQuestionIcon;
