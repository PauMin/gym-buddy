import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Calendar, 
  History, 
  Play, 
  Save, 
  Trash2, 
  ChevronLeft, 
  Star, 
  Clock, 
  Activity,
  MoreVertical,
  X
} from 'lucide-react';

// Utility components for UI consistency
const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false }) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700",
    secondary: "bg-white text-slate-700 border-2 border-slate-100 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-slate-500 hover:bg-slate-100",
    fab: "fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-xl bg-blue-600 text-white z-50 flex items-center justify-center"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} disabled={disabled}>
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 ${className}`}>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1 mb-3">
    {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
    <input 
      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base"
      {...props}
    />
  </div>
);

export default function App() {
  // --- State Management ---
  const [view, setView] = useState('home'); // home, create, active, finish, history, details
  const [workouts, setWorkouts] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Active Session State
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [sessionData, setSessionData] = useState({});
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
  // Create/Edit Form State
  const [newWorkout, setNewWorkout] = useState({ name: '', description: '', exercises: [] });
  const [tempExercise, setTempExercise] = useState({ name: '', reps: '', sets: '' });
  
  // Finish Screen State
  const [finishData, setFinishData] = useState({ rating: 0, comment: '' });

  // Load data on mount
  useEffect(() => {
    const savedWorkouts = localStorage.getItem('gymBuddy_workouts');
    const savedLogs = localStorage.getItem('gymBuddy_logs');
    if (savedWorkouts) setWorkouts(JSON.parse(savedWorkouts));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem('gymBuddy_workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('gymBuddy_logs', JSON.stringify(logs));
  }, [logs]);

  // --- Handlers ---

  const handleCreateWorkout = () => {
    if (!newWorkout.name.trim()) return;
    const workout = {
      ...newWorkout,
      id: Date.now().toString(),
      exercises: newWorkout.exercises.length > 0 ? newWorkout.exercises : []
    };
    setWorkouts([...workouts, workout]);
    setNewWorkout({ name: '', description: '', exercises: [] });
    setView('home');
  };

  const handleAddExerciseToNew = () => {
    if (!tempExercise.name.trim()) return;
    setNewWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...tempExercise, id: Date.now().toString() }]
    }));
    setTempExercise({ name: '', reps: '', sets: '' });
  };

  const startWorkout = (workout) => {
    setActiveWorkout(workout);
    setSessionStartTime(Date.now());
    
    // Initialize session data structure
    const initialSession = {};
    workout.exercises.forEach(ex => {
      initialSession[ex.id] = Array(parseInt(ex.sets) || 1).fill({ weight: '', reps: '' });
    });
    setSessionData(initialSession);
    setView('active');
  };

  const updateSessionSet = (exerciseId, setIndex, field, value) => {
    setSessionData(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, idx) => 
        idx === setIndex ? { ...set, [field]: value } : set
      )
    }));
  };

  const finishSession = () => {
    setView('finish');
  };

  const saveLog = () => {
    const log = {
      id: Date.now().toString(),
      workoutId: activeWorkout.id,
      workoutName: activeWorkout.name,
      date: new Date().toISOString(),
      duration: Date.now() - sessionStartTime,
      rating: finishData.rating,
      comment: finishData.comment,
      sessionData: sessionData,
      exercises: activeWorkout.exercises // Snapshot of exercises at time of workout
    };
    setLogs([log, ...logs]);
    setFinishData({ rating: 0, comment: '' });
    setActiveWorkout(null);
    setSessionData({});
    setView('history');
  };

  const deleteWorkout = (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this workout routine?')) {
      setWorkouts(workouts.filter(w => w.id !== id));
    }
  };

  // --- Render Views ---

  const renderHome = () => (
    <div className="pb-24">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-slate-800">My Routines</h1>
        <p className="text-slate-500">Select a workout to start training</p>
      </header>
      
      {workouts.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No workouts yet</h3>
          <p className="text-slate-500 mb-6">Create your first routine to get started.</p>
          <Button onClick={() => setView('create')}>Create Workout</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {workouts.map(workout => (
            <Card key={workout.id} className="relative group active:scale-[0.99] transition-transform">
              <div onClick={() => startWorkout(workout)} className="cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{workout.name}</h3>
                  <button 
                    onClick={(e) => deleteWorkout(workout.id, e)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {workout.description && <p className="text-slate-500 mb-4 text-sm">{workout.description}</p>}
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {workout.exercises.slice(0, 3).map(ex => (
                    <span key={ex.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                      {ex.name}
                    </span>
                  ))}
                  {workout.exercises.length > 3 && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                      +{workout.exercises.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 py-2 text-sm" 
                    icon={Play}
                    onClick={(e) => { e.stopPropagation(); startWorkout(workout); }}
                  >
                    Start
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <Button variant="fab" onClick={() => setView('create')}>
        <Plus size={28} />
      </Button>
    </div>
  );

  const renderCreate = () => (
    <div className="pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setView('home')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">New Routine</h1>
      </div>

      <div className="space-y-6">
        <section>
          <Input 
            label="Workout Name" 
            placeholder="e.g., Chest Day, Full Body A" 
            value={newWorkout.name}
            onChange={e => setNewWorkout({...newWorkout, name: e.target.value})}
          />
          <Input 
            label="Description (Optional)" 
            placeholder="Focus on hypertrophy..." 
            value={newWorkout.description}
            onChange={e => setNewWorkout({...newWorkout, description: e.target.value})}
          />
        </section>

        <section>
          <div className="flex justify-between items-end mb-4">
            <h3 className="font-bold text-slate-700">Exercises</h3>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
            <Input 
              label="Exercise Name" 
              placeholder="e.g., Bench Press" 
              value={tempExercise.name}
              onChange={e => setTempExercise({...tempExercise, name: e.target.value})}
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <Input 
                  label="Sets" 
                  type="number" 
                  placeholder="3" 
                  value={tempExercise.sets}
                  onChange={e => setTempExercise({...tempExercise, sets: e.target.value})}
                />
              </div>
              <div className="flex-1">
                <Input 
                  label="Reps" 
                  type="text" 
                  placeholder="8-12" 
                  value={tempExercise.reps}
                  onChange={e => setTempExercise({...tempExercise, reps: e.target.value})}
                />
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="w-full mt-2"
              onClick={handleAddExerciseToNew}
              disabled={!tempExercise.name}
            >
              Add Exercise
            </Button>
          </div>

          <div className="space-y-3">
            {newWorkout.exercises.map((ex, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <div>
                  <div className="font-semibold text-slate-700">{ex.name}</div>
                  <div className="text-xs text-slate-400">{ex.sets} sets × {ex.reps} reps</div>
                </div>
                <button 
                  onClick={() => setNewWorkout(prev => ({...prev, exercises: prev.exercises.filter((_, i) => i !== idx)}))}
                  className="text-slate-300 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200">
        <Button className="w-full" onClick={handleCreateWorkout} disabled={!newWorkout.name || newWorkout.exercises.length === 0}>
          Save Workout
        </Button>
      </div>
    </div>
  );

  const renderActive = () => (
    <div className="pb-32">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 py-4 mb-6">
        <div className="flex justify-between items-center mb-1">
          <button onClick={() => { if(confirm('Cancel workout?')) setView('home'); }} className="text-slate-400">
            <X size={24} />
          </button>
          <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
            <Activity size={12} />
            In Progress
          </div>
          <div className="w-6" /> 
        </div>
        <h2 className="text-2xl font-black text-center text-slate-800">{activeWorkout.name}</h2>
      </div>

      <div className="space-y-8">
        {activeWorkout.exercises.map((exercise) => (
          <div key={exercise.id} className="bg-white">
            <div className="flex justify-between items-baseline mb-3 px-1">
              <h3 className="text-lg font-bold text-slate-800">{exercise.name}</h3>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Target: {exercise.sets} × {exercise.reps}</span>
            </div>
            
            <div className="border rounded-xl overflow-hidden border-slate-200">
              <div className="grid grid-cols-[3rem_1fr_1fr] bg-slate-50 text-xs font-bold text-slate-500 text-center py-2 border-b border-slate-200">
                <span>SET</span>
                <span>LBS/KG</span>
                <span>REPS</span>
              </div>
              {sessionData[exercise.id]?.map((set, idx) => (
                <div key={idx} className="grid grid-cols-[3rem_1fr_1fr] border-b border-slate-100 last:border-0 divide-x divide-slate-100">
                  <div className="flex items-center justify-center bg-slate-50 font-bold text-slate-400 text-sm">
                    {idx + 1}
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    className="p-3 text-center text-lg font-semibold text-slate-800 outline-none focus:bg-blue-50 transition-colors"
                    value={set.weight}
                    onChange={(e) => updateSessionSet(exercise.id, idx, 'weight', e.target.value)}
                  />
                  <input
                    type="tel"
                    placeholder="0"
                    className="p-3 text-center text-lg font-semibold text-slate-800 outline-none focus:bg-blue-50 transition-colors"
                    value={set.reps}
                    onChange={(e) => updateSessionSet(exercise.id, idx, 'reps', e.target.value)}
                  />
                </div>
              ))}
              <button 
                className="w-full py-2 bg-slate-50 text-slate-500 text-xs font-bold hover:bg-slate-100 transition-colors border-t border-slate-200"
                onClick={() => {
                   setSessionData(prev => ({
                     ...prev,
                     [exercise.id]: [...prev[exercise.id], { weight: '', reps: '' }]
                   }))
                }}
              >
                + ADD SET
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-20">
        <Button className="w-full text-lg py-4 shadow-xl shadow-blue-200/50" onClick={finishSession}>
          Finish Workout
        </Button>
      </div>
    </div>
  );

  const renderFinish = () => (
    <div className="pt-8 pb-24 text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Save size={40} />
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-2">Workout Complete!</h2>
      <p className="text-slate-500 mb-8">Great job crushing {activeWorkout.name}</p>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 text-left">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block text-center">Rate your session</label>
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setFinishData({...finishData, rating: star})}
              className={`transition-all ${star <= finishData.rating ? 'text-yellow-400 scale-110' : 'text-slate-200'}`}
            >
              <Star size={40} fill={star <= finishData.rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>

        <Input 
          label="Session Notes" 
          placeholder="Felt strong on bench, need to work on form..."
          as="textarea"
          rows={4}
          value={finishData.comment}
          onChange={e => setFinishData({...finishData, comment: e.target.value})}
        />
      </div>

      <Button className="w-full py-4 text-lg" onClick={saveLog}>Save to History</Button>
    </div>
  );

  const renderHistory = () => (
    <div className="pb-24">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-slate-800">History</h1>
        <p className="text-slate-500">Your past training sessions</p>
      </header>

      {logs.length === 0 ? (
         <div className="text-center py-12 px-4 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
            <History size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No workout history yet.</p>
         </div>
      ) : (
        <div className="space-y-4">
          {logs.map(log => (
            <Card key={log.id}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{log.workoutName}</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Calendar size={12} />
                    {new Date(log.date).toLocaleDateString()} at {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <div className="flex text-yellow-400">
                  {[...Array(log.rating || 0)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
              </div>
              
              {log.comment && (
                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 italic mb-4 border border-slate-100">
                  "{log.comment}"
                </div>
              )}

              <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                {log.exercises.map(ex => {
                   const sets = log.sessionData[ex.id];
                   if (!sets) return null;
                   // Calculate best set
                   const bestSet = sets.reduce((max, curr) => (parseFloat(curr.weight) > parseFloat(max.weight) ? curr : max), {weight: 0});
                   
                   return (
                     <div key={ex.id} className="flex justify-between text-sm">
                       <span className="text-slate-700 font-medium">{ex.name}</span>
                       <span className="text-slate-400">{sets.length} sets <span className="mx-1">•</span> Best: {bestSet.weight || 0}kg</span>
                     </div>
                   );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // --- Main Layout ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative">
        {/* View Content */}
        <div className="p-5">
          {view === 'home' && renderHome()}
          {view === 'create' && renderCreate()}
          {view === 'active' && renderActive()}
          {view === 'finish' && renderFinish()}
          {view === 'history' && renderHistory()}
        </div>

        {/* Bottom Navigation (Only show on Home and History) */}
        {(view === 'home' || view === 'history') && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-40 max-w-md mx-auto">
            <button 
              onClick={() => setView('home')}
              className={`flex flex-col items-center gap-1 transition-colors ${view === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <Dumbbell size={24} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Workouts</span>
            </button>
            <div className="w-px h-8 bg-slate-100"></div>
            <button 
              onClick={() => setView('history')}
              className={`flex flex-col items-center gap-1 transition-colors ${view === 'history' ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <History size={24} />
              <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
