
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, Status, Priority } from '../types';
import { X, Sparkles, Loader2, ListChecks, Plus } from 'lucide-react';
import { generateSubtasks } from '../services/geminiService';

interface TaskModalProps {
  task?: Task | null;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<Status>(task?.status || Status.TODO);
  const [priority, setPriority] = useState<Priority>(task?.priority || Priority.NORMAL);
  const [dueDate, setDueDate] = useState(task?.dueDate || new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSubtasks, setAiSubtasks] = useState<string[]>([]);
  
  const modalRef = useRef<HTMLDivElement>(null);

  const handleToggleCheck = (index: number) => {
    const lines = description.split('\n');
    let checkboxCount = 0;
    const newLines = lines.map(line => {
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        if (checkboxCount === index) {
          const isDone = line.trim().startsWith('- [x]');
          const content = line.replace(/^- \[[x ]\] /, '');
          checkboxCount++;
          return `- [${isDone ? ' ' : 'x'}] ${content}`;
        }
        checkboxCount++;
      }
      return line;
    });

    const newDescription = newLines.join('\n');
    setDescription(newDescription);

    const hasUnfinished = newLines.some(l => l.trim().startsWith('- [ ]'));
    const hasAny = newLines.some(l => l.trim().startsWith('- [x]'));
    if (!hasUnfinished && hasAny) setStatus(Status.DONE);
    else if (hasAny) setStatus(Status.IN_PROGRESS);
  };

  const parsedChecklist = useMemo(() => {
    return description.split('\n')
      .filter(l => l.trim().startsWith('- [ ]') || l.trim().startsWith('- [x]'))
      .map(l => ({
        done: l.trim().startsWith('- [x]'),
        text: l.replace(/^- \[[x ]\] /, '')
      }));
  }, [description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: task?.id, title, description, status, priority, dueDate });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleAISuggest = async () => {
    if (!title) return;
    setIsGenerating(true);
    const subtasks = await generateSubtasks(title, description);
    setAiSubtasks(subtasks);
    setIsGenerating(false);
  };

  const addAiToDescription = () => {
    const checklist = aiSubtasks.map(st => `- [ ] ${st}`).join('\n');
    setDescription(prev => prev ? `${prev}\n\n${checklist}` : checklist);
    setAiSubtasks([]);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">
            {task ? 'Редактировать' : 'Новая задача'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Название</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-gray-900"
                placeholder="Что нужно сделать?"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Описание и чек-лист</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-xs leading-relaxed text-gray-900"
                placeholder="Используйте - [ ] для создания подзадач"
              />
            </div>

            {parsedChecklist.length > 0 && (
              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <div className="space-y-1.5">
                  {parsedChecklist.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleToggleCheck(idx)}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                        item.done ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-gray-300'
                      }`}>
                        {item.done && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className={`text-xs font-medium transition-all ${item.done ? 'text-gray-300 line-through' : 'text-gray-600'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-xs font-bold appearance-none cursor-pointer text-gray-900"
              >
                {Object.values(Status).map(s => <option key={s} value={s} className="text-gray-900 bg-white">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Приоритет</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-xs font-bold appearance-none cursor-pointer text-gray-900"
              >
                {Object.values(Priority).map(p => <option key={p} value={p} className="text-gray-900 bg-white">{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Дедлайн</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-xs font-bold text-gray-900"
              />
            </div>
          </div>

          <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">AI Планировщик</h3>
              </div>
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={isGenerating || !title}
                className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListChecks className="w-3 h-3" />}
                {isGenerating ? 'Думаю...' : 'Разбить'}
              </button>
            </div>

            {aiSubtasks.length > 0 && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  {aiSubtasks.map((st, idx) => (
                    <div key={idx} className="bg-white/60 p-2 rounded-lg border border-indigo-100/30 text-[10px] font-semibold text-indigo-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full" />
                      {st}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addAiToDescription}
                  className="w-full py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-50 transition-all uppercase tracking-wider"
                >
                  Вставить в описание
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-50 text-gray-500 rounded-xl font-bold text-[10px] hover:bg-gray-100 transition-all uppercase tracking-wider"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase tracking-wider"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
