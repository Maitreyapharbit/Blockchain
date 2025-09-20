import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider, DefaultTheme } from 'styled-components';

interface Props {
  children: ReactNode;
}

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const ThemeProvider = ({ children }: Props) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const toggleDarkMode = () => {
    setDarkMode((prev: boolean) => !prev);
  };

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const theme: DefaultTheme = {
    mode: darkMode ? 'dark' : 'light',
    colors: {
      primary: darkMode ? '#60a5fa' : '#3b82f6',
      secondary: darkMode ? '#8b5cf6' : '#6d28d9',
      background: darkMode ? '#111827' : '#f9fafb',
      surface: darkMode ? '#1f2937' : '#ffffff',
      text: darkMode ? '#f9fafb' : '#111827',
      textSecondary: darkMode ? '#9ca3af' : '#6b7280',
      border: darkMode ? '#374151' : '#e5e7eb',
      error: darkMode ? '#ef4444' : '#dc2626',
      success: darkMode ? '#10b981' : '#059669',
      warning: darkMode ? '#f59e0b' : '#d97706',
      info: darkMode ? '#3b82f6' : '#2563eb'
    },
    spacing: {
      xxs: '0.125rem',
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    typography: {
      fonts: {
        primary: '"Inter", system-ui, sans-serif',
        secondary: '"Fira Code", Monaco, Consolas, monospace'
      },
      sizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        md: '1rem',
        lg: '1.125rem',
        xl: '1.25rem'
      },
      weights: {
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    radii: {
      none: '0',
      sm: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    breakpoints: {
      mobile: '640px',
      tablet: '768px',
      desktop: '1024px',
      wide: '1280px'
    },
    zIndex: {
      dropdown: 1000,
      modal: 1100,
      tooltip: 1200,
      toast: 1300
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
