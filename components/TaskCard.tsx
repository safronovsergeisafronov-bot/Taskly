
import React, { useMemo } from 'react';
import { Task, Priority, Status } from '../types';
import { 
  AlertCircle, 
  Clock, 
  MoreVertical, 
  Circle, 
  ArrowUpCircle,
  AlertTriangle,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onStatusChange: (id: string, status: Status) => void;
}

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const colors = {
    [Priority.LOW]: 'bg-gray-100 text-gray-600',
    [Priority.NORMAL]: 'bg-blue-50 text-blue-600',
    [Priority.HIGH]: 'bg-orange-50 text-orange-600',
    [Priority.URGENT]: 'bg-red-50 text-red-600',
  };

  const icons = {
    [Priority.LOW]: <Circle className="w-3 h-3" />,
    [Priority.NORMAL]: <ArrowUpCircle className="w-3 h-3" />,
    [Priority.HIGH]: <AlertTriangle className="w-3 h-3" />,
    [Priority.URGENT]: <AlertCircle className="w-3 h-3" />,
  };

  return (
    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${colors[priority]}`}>
      {icons[priority]}
      {priority}
    </span>
  );
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onStatusChange }) => {
  const isCompleted = task.status === Status.DONE;

  const progress = useMemo(() => {
    const lines = task.description.split('\n');
    const checkboxes = lines.filter(l => l.trim().startsWith('- [ ]') || l.trim().startsWith('- [x]'));
    if (checkboxes.length === 0) return null;
    const completed = checkboxes.filter(l => l.trim().startsWith('- [x]')).length;
    return {
      percent: Math.round((completed / checkboxes.length) * 100),
      text: `${completed}/${checkboxes.length}`
    };
  }, [task.description]);

  return (
    <div 
      onClick={() => onClick(task)}
      className={`bg-white p-3.5 rounded-xl border transition-all cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 ${
        isCompleted ? 'opacity-50 grayscale border-gray-100' : 'border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <h3 className={`text-xs font-bold text-gray-800 line-clamp-1 ${
          isCompleted ? 'line-through text-gray-400' : ''
        }`}>
          {task.title}
        </h3>
        <button className="text-gray-300 hover:text-gray-600 transition-colors p-0.5">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <p className={`text-[11px] mb-3 line-clamp-2 h-8 leading-normal ${isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
        {task.description.replace(/- \[[x ]\] /g, '') || "Нет описания"}
      </p>

      {progress && (
        <div className="mb-3">
          <div className="flex justify-between text-[9px] font-bold text-gray-400 mb-1">
            <span>ПРОГРЕСС</span>
            <span>{progress.text}</span>
          </div>
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500" 
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-50 pt-2.5">
        <PriorityBadge priority={task.priority} />
        
        <div className="flex items-center text-gray-400 text-[9px] font-bold">
          <Clock className="w-3 h-3 mr-1" />
          <span>{task.dueDate}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
