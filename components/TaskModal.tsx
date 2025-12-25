
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, Status, Priority } from '../types';
import { X, Sparkles, Loader2, ListChecks, Zap, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [newTokens, setNewTokens] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  
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
    setDescription(newLines.join('\n'));
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
    onSave({ 
      id: task?.id, 
      title, 
      description, 
      status, 
      priority, 
      dueDate,
      tokensUsed: (task?.tokensUsed || 0) + newTokens
    });
  };

  const handleAISuggest = async () => {
    if (!title) return;
    setIsGenerating(true);
    setApiError(null);
    try {
      const result = await generateSubtasks(title, description);
      if (result.isError) {
        setApiError(result.errorMsg || "Ошибка AI сервиса.");
      } else {
        setAiSubtasks(result.subtasks);
        setNewTokens(prev => prev + (result.tokens || 0));
      }
    } catch (err) {
      setApiError("Не удалось связаться с сервером. Проверьте интернет.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
              {task ? 'Редактирование' : 'Новая задача'}
            </h2>
            {(task?.tokensUsed || 0) + newTokens > 0 && (
               <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                 <Zap className="w-3 h-3 fill-indigo-600" />
                 {(task?.tokensUsed || 0) + newTokens}
               </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Название задачи</label>
              <input
                required
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-base font-bold text-gray-900 placeholder:font-normal"
                placeholder="Например: Постирать вещи"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Описание и чек-лист</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm leading-relaxed text-gray-700 custom-scrollbar"
                placeholder="Опишите детали... Используйте '- [ ] ' для чек-листа"
              />
            </div>

            {parsedChecklist.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                {parsedChecklist.map((item, idx) => (
                  <div key={idx} onClick={() => handleToggleCheck(idx)} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      item.done ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-gray-300 group-hover:border-indigo-400'
                    }`}>
                      {item.done && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    <span className={`text-sm font-semibold transition-all ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Статус</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 cursor-pointer focus:ring-4 focus:ring-indigo-500/10">
                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Приоритет</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 cursor-pointer focus:ring-4 focus:ring-indigo-500/10">
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Дедлайн</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-500/10"/>
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider">AI Мозговой штурм</h3>
              </div>
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={isGenerating || !title}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 uppercase tracking-tight"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />}
                {isGenerating ? 'Анализирую...' : 'Разбить на задачи'}
              </button>
            </div>

            {apiError && (
              <div className="bg-white border border-red-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-red-600 leading-tight">
                    {apiError}
                  </p>
                  <button 
                    type="button" 
                    onClick={() => window.location.reload()} 
                    className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Обновить страницу
                  </button>
                </div>
              </div>
            )}

            {aiSubtasks.length > 0 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 gap-2">
                  {aiSubtasks.map((st, idx) => (
                    <div key={idx} className="bg-white px-3 py-2 rounded-lg border border-indigo-100 text-[11px] font-bold text-indigo-800 flex items-center gap-2 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                      {st}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const checklist = aiSubtasks.map(st => `- [ ] ${st}`).join('\n');
                      setDescription(prev => prev ? `${prev}\n\n${checklist}` : checklist);
                      setAiSubtasks([]);
                    }}
                    className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-50 hover:border-indigo-200 transition-all uppercase tracking-widest shadow-sm"
                  >
                    Добавить в план
                  </button>
                  <p className="text-center text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                    Использовано {newTokens} AI токенов
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs hover:bg-gray-100 transition-all uppercase tracking-widest">
              Закрыть
            </button>
            <button type="submit" className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest">
              Сохранить задачу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
