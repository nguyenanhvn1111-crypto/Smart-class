import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClassModel } from '../types';
import { DataService } from '../services/dataService';

interface ClassContextType {
  classes: ClassModel[];
  selectedClassId: string;
  selectedClass: ClassModel | undefined;
  setSelectedClassId: (id: string) => void;
  refreshClasses: () => Promise<void>;
  isLoading: boolean;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('cls-10a1');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshClasses = async () => {
    setIsLoading(true);
    try {
      const list = await DataService.getClasses();
      setClasses(list);
      if (!selectedClassId && list.length > 0) {
        setSelectedClassId(list[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshClasses();
    const unsubscribe = DataService.subscribe(() => {
      DataService.getClasses().then(setClasses);
    });
    return unsubscribe;
  }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  return (
    <ClassContext.Provider
      value={{
        classes,
        selectedClassId,
        selectedClass,
        setSelectedClassId,
        refreshClasses,
        isLoading
      }}
    >
      {children}
    </ClassContext.Provider>
  );
};

export const useClass = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
};
