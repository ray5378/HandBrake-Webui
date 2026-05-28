/**
 * 自定义 Hooks
 */

import { useState, useEffect } from 'react';

/**
 * 分页 Hook
 * @param {number} initialPage - 初始页码
 * @param {number} initialLimit - 初始每页数量
 * @returns {Object} 分页状态和方法
 */
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = () => setPage(p => p + 1);
  const prevPage = () => setPage(p => Math.max(1, p - 1));
  const goToPage = pageNum => setPage(Math.max(1, pageNum));
  const resetPagination = () => setPage(1);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    resetPagination
  };
}

/**
 * 异步请求 Hook
 * @param {Function} asyncFn - 异步函数
 * @param {Array} deps - 依赖数组
 * @returns {Object} 请求状态和数据
 */
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    async function execute() {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await asyncFn();

        if (!cancelled) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ data: null, loading: false, error });
        }
      }
    }

    execute();

    return () => {
      cancelled = true;
    };
  }, deps);

  return state;
}

/**
 * 本地存储 Hook
 * @param {string} key - 存储键名
 * @param {*} initialValue - 初始值
 * @returns {Array} [value, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);

      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);

      return initialValue;
    }
  });

  const setValue = value => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);

      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  };

  return [storedValue, setValue, removeValue];
}

/**
 * 窗口大小 Hook
 * @returns {Object} 窗口宽度和高度
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

/**
 * 防抖 Hook
 * @param {*} value - 要防抖的值
 * @param {number} delay - 延迟毫秒数
 * @returns {*} 防抖后的值
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
