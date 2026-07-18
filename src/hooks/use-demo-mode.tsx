import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type DemoRole = "trainer" | "student";

interface DemoModeContextType {
  isDemoMode: boolean;
  demoRole: DemoRole;
  setDemoRole: (role: DemoRole) => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  isDemoEnabled: boolean;
}

const DemoModeContext = createContext<DemoModeContextType | null>(null);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<DemoRole>("student");

  useEffect(() => {
    const stored = localStorage.getItem("demoMode");
    const storedRole = localStorage.getItem("demoRole") as DemoRole | null;
    if (stored === "true") {
      setIsDemoMode(true);
      if (storedRole) setDemoRole(storedRole);
    }
  }, []);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem("demoMode", "true");
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem("demoMode");
    localStorage.removeItem("demoRole");
  };

  const handleSetDemoRole = (role: DemoRole) => {
    setDemoRole(role);
    localStorage.setItem("demoRole", role);
  };

  return (
    <DemoModeContext.Provider 
      value={{ 
        isDemoMode, 
        demoRole, 
        setDemoRole: handleSetDemoRole, 
        enterDemoMode, 
        exitDemoMode,
        isDemoEnabled: true
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    return {
      isDemoMode: false,
      demoRole: "student" as DemoRole,
      setDemoRole: () => {},
      enterDemoMode: () => {},
      exitDemoMode: () => {},
      isDemoEnabled: false,
    };
  }
  return context;
}

export const DEMO_DATA = {
  student: {
    profile: {
      id: 999,
      userId: "demo-student",
      role: "student" as const,
      bio: "Alumno demo apasionado por el fitness y la vida saludable.",
      goals: "Ganar masa muscular y mejorar mi resistencia cardiovascular.",
      stats: { height: 175, weight: 70, age: 28, activityLevel: "moderate" }
    },
    points: {
      id: 999,
      studentId: "demo-student",
      totalPoints: 245,
      workoutsCompleted: 8,
      checkinsCompleted: 5,
      discountCouponsEarned: 0,
      updatedAt: new Date().toISOString()
    },
    transactions: [
      { id: 1, studentId: "demo-student", points: 25, type: "workout" as const, description: "Entrenamiento completado: Piernas", createdAt: new Date().toISOString() },
      { id: 2, studentId: "demo-student", points: 10, type: "checkin" as const, description: "Check-in de bienestar diario", createdAt: new Date().toISOString() },
      { id: 3, studentId: "demo-student", points: 25, type: "workout" as const, description: "Entrenamiento completado: Pecho", createdAt: new Date().toISOString() },
    ],
    routines: [
      {
        id: 1,
        trainerId: "demo-trainer",
        studentId: "demo-student",
        title: "Rutina Full Body - Semana 1",
        description: "Rutina de iniciación para principiantes",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  trainer: {
    profile: {
      id: 998,
      userId: "demo-trainer",
      role: "trainer" as const,
      bio: "Entrenador personal certificado con 5 años de experiencia.",
      goals: "Ayudar a mis alumnos a alcanzar sus metas de fitness.",
      stats: null
    },
    students: [
      { id: "student-1", email: "maria@example.com", firstName: "María", lastName: "García" },
      { id: "student-2", email: "carlos@example.com", firstName: "Carlos", lastName: "López" },
    ],
    routines: [
      {
        id: 1,
        trainerId: "demo-trainer",
        studentId: "student-1",
        title: "Rutina Full Body - Semana 1",
        description: "Rutina de iniciación para principiantes",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        trainerId: "demo-trainer",
        studentId: "student-2",
        title: "Rutina de Fuerza - Mes 2",
        description: "Enfoque en desarrollo de fuerza",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
};
