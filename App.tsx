
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ListTodo, 
  Settings, 
  Search, 
  Plus, 
  Bell, 
  Calendar as CalendarIcon,
  Sparkles,
  User,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Task, Status, Priority, ViewType } from './types';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';
import { isAiConfigured } from './services/geminiService';

const LOCAL_STORAGE_KEY = 'zenith_tasks_v2';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeView, setActiveView] = useState<ViewType>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiStatus, setAiStatus] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    // Проверяем статус AI при загрузке
    setAiStatus(isAiConfigured());
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (taskData.id) {
      setTasks(tasks.map(t => t.id === taskData.id ? { ...t, ...taskData } as Task : t));
    } else {
      const newTask: Task = {
        ...taskData as Task,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now()
      };
      setTasks([newTask, ...tasks]);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const CalendarView = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            {today.toLocaleString('ru', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-1">
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden text-sm">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <div key={d} className="bg-gray-50 py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
          {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white min-h-[100px]"></div>
          ))}
          {days.map(day => {
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTasks = tasks.filter(t => t.dueDate === dateStr);
            return (
              <div key={day} className="bg-white min-h-[100px] p-2 hover:bg-indigo-50/20 transition-colors group relative border-t border-l border-gray-50">
                <span className={`text-xs font-bold ${day === today.getDate() ? 'bg-indigo-600 text-white w-5 h-5 flex items-center justify-center rounded-md' : 'text-gray-400'}`}>
                  {day}
                </span>
                <div className="mt-1 space-y-1">
                  {dayTasks.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => { setEditingTask(t); setIsModalOpen(true); }}
                      className="text-[9px] font-medium bg-white border border-gray-100 p-1 rounded shadow-sm truncate hover:border-indigo-300 transition-all cursor-pointer text-gray-700"
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const PopoverModal = ({ title, onClose, children }: any) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-800 uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-50 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e1e2d] text-white flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">Z</div>
          <h1 className="text-xl font-bold tracking-tight">Zenith</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <button 
            onClick={() => setActiveView('board')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeView === 'board' ? 'bg-[#2b2b40] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2b2b40]/50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-semibold text-sm">Доска</span>
          </button>
          <button 
            onClick={() => setActiveView('list')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeView === 'list' ? 'bg-[#2b2b40] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2b2b40]/50'}`}
          >
            <ListTodo className="w-5 h-5" />
            <span className="font-semibold text-sm">Список</span>
          </button>
          <button 
             onClick={() => setActiveView('calendar')}
             className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeView === 'calendar' ? 'bg-[#2b2b40] text-white' : 'text-gray-400 hover:text-white hover:bg-[#2b2b40]/50'}`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="font-semibold text-sm">Календарь</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          {/* AI Status Indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${aiStatus ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {aiStatus ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            AI: {aiStatus ? 'Активен' : 'Не настроен'}
          </div>

          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2b2b40]/50 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium text-xs">Настройки</span>
          </button>
          
          <div 
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 p-3 bg-[#2b2b40]/50 rounded-xl cursor-pointer hover:bg-[#2b2b40] transition-all"
          >
            <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div className="text-xs truncate">
              <p className="font-bold">Алексей</p>
              <p className="text-gray-500 text-[10px]">Тариф: Профессионал</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input 
                type="text" 
                placeholder="Поиск по задачам..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
               onClick={() => setShowNotifications(true)}
               className="p-2 text-gray-400 hover:text-indigo-600 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button 
              onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
              className="bg-indigo-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              <Plus className="w-4 h-4" />
              <span className="font-bold text-sm">Добавить</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50/50 p-6 custom-scrollbar">
          {activeView === 'board' ? (
            <div className="flex gap-6 min-h-full pb-6">
              {Object.values(Status).map(status => (
                <div key={status} className="w-72 flex-shrink-0 flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">{status}</h2>
                      <span className="text-gray-400 text-[10px] font-bold">
                        {filteredTasks.filter(t => t.status === status).length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 kanban-column">
                    {filteredTasks.filter(t => t.status === status).map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onClick={() => { setEditingTask(task); setIsModalOpen(true); }}
                        onStatusChange={() => {}} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : activeView === 'calendar' ? (
            <CalendarView />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Лист вью (упрощенный код для экономии места) */}
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                    <th className="px-6 py-4">Задача</th>
                    <th className="px-6 py-4">Статус</th>
                    <th className="px-6 py-4">Дедлайн</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTasks.map(task => (
                    <tr key={task.id} onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="hover:bg-gray-50 transition-all cursor-pointer">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">{task.title}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold">{task.status}</span></td>
                      <td className="px-6 py-4 text-xs text-gray-400">{task.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && (
        <TaskModal 
          task={editingTask}
          onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
          onSave={handleSaveTask}
        />
      )}
      
      {showNotifications && <PopoverModal title="Уведомления" onClose={() => setShowNotifications(false)}><div className="py-10 text-center text-gray-400 text-xs font-bold uppercase">Пусто</div></PopoverModal>}
      {showSettings && <PopoverModal title="Настройки" onClose={() => setShowSettings(false)}><div className="p-4 bg-gray-50 rounded-xl text-xs font-bold text-gray-600">Версия 3.0.1 (Stable)</div></PopoverModal>}
      {showProfile && <PopoverModal title="Профиль" onClose={() => setShowProfile(false)}><div className="text-center"><User className="w-12 h-12 mx-auto mb-2 text-indigo-400"/><p className="font-bold">Алексей</p><p className="text-[10px] text-gray-400">Pro Account</p></div></PopoverModal>}
    </div>
  );
};

export default App;
