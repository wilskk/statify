import { useState, useRef, useEffect, useCallback } from "react";
import { SheetData, parseExcelWithWorker } from "../services/services";

export const useExcelWorker = () => {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerPromiseRef = useRef<{
    promise: Promise<SheetData[]>;
    cancel: () => void;
  } | null>(null);

  const parse = useCallback((file: File): Promise<SheetData[]> => {
    setIsParsing(true);
    setError(null);
    const promise = parseExcelWithWorker(file)
      .then((result) => {
        setIsParsing(false);
        return result;
      })
      .catch((err) => {
        setError(err.message);
        setIsParsing(false);
        return Promise.reject(err);
      });
    workerPromiseRef.current = { promise, cancel: () => {} };
    return promise;
  }, []);

  useEffect(() => {
    return () => {
      // no-op: worker in service self-terminates
    };
  }, []);

  return { isParsing, error, parse };
};
