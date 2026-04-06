import { Play, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  progress: number;
  totalDuration: string;
}

interface LessonListProps {
  modules: Module[];
  currentLessonId?: string;
  onLessonClick: (lessonId: string) => void;
  expandAllModules?: boolean;
}

const LessonList = ({ modules, currentLessonId, onLessonClick, expandAllModules = false }: LessonListProps) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Keeps expanded state in sync when modules load asynchronously.
  useEffect(() => {
    if (modules.length === 0) return;
    setExpandedModules(expandAllModules ? modules.map((m) => m.id) : [modules[0].id]);
  }, [modules, expandAllModules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const isExpanded = expandedModules.includes(module.id);
        
        return (
          <div key={module.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleModule(module.id)}
              type="button"
              className="w-full p-4 bg-card hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 text-sm">{module.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {module.lessons.filter((l) => l.completed).length}/{module.lessons.length}
                    </span>
                    <span>•</span>
                    <span>{module.totalDuration}</span>
                  </div>
                  <Progress value={module.progress} className="h-1 mt-2" />
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t">
                {module.lessons.map((lesson) => {
                  const isActive = lesson.id === currentLessonId;
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onLessonClick(lesson.id)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
                        isActive ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {lesson.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Play className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{lesson.title}</div>
                        <div className="text-xs text-muted-foreground">{lesson.duration}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LessonList;
