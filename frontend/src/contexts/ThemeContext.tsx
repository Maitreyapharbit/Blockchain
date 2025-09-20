import React, { createContext, useContext, useState } from 'react';import React, { createContext, useContext, useState } from 'react';import React, { createContext, useContext, useState, ReactNode } from 'react';import React, { createContext, useContext, useState, ReactNode } from 'react';import React, { createContext, useContext, useState, ReactNode } from 'react';import React, { createContext, useContext, useState, ReactNode } from 'react';import React, { createContext, useContext, useState, ReactNode } from 'react';

import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import type { DefaultTheme } from 'styled-components';import { ThemeProvider as StyledThemeProvider } from 'styled-components';

import { GlobalStyles } from '../styles/GlobalStyles';

import { ThemeProvider as StyledThemeProvider } from 'styled-components';

const theme: DefaultTheme = {

  colors: {const lightTheme = {

    primary: '#1E88E5',

    secondary: '#6C757D',  colors: {import type { DefaultTheme } from 'styled-components';import { ThemeProvider as StyledThemeProvider } from 'styled-components';

    background: '#FFFFFF',

    text: '#212529',    primary: '#1E88E5',

  },

};    secondary: '#6C757D',



const darkTheme: DefaultTheme = {    background: '#FFFFFF',

  colors: {

    primary: '#90CAF9',    text: '#212529',const lightTheme: DefaultTheme = {import type { DefaultTheme } from 'styled-components';import { ThemeProvider as StyledThemeProvider, DefaultTheme } from 'styled-components';

    secondary: '#ADB5BD',

    background: '#212529',  },

    text: '#F8F9FA',

  },};  colors: {

};



interface ThemeContextType {

  isDarkMode: boolean;const darkTheme = {    primary: '#1E88E5',

  toggleTheme: () => void;

}  colors: {



const ThemeContext = createContext<ThemeContextType | undefined>(undefined);    primary: '#90CAF9',    secondary: '#6C757D',



export const useTheme = () => {    secondary: '#ADB5BD',

  const context = useContext(ThemeContext);

  if (!context) {    background: '#212529',    background: '#FFFFFF',const lightTheme: DefaultTheme = {import { ThemeProvider as StyledThemeProvider, DefaultTheme } from 'styled-components';import { ThemeProvider as StyledThemeProvider, DefaultTheme } from 'styled-components';// src/contexts/ThemeContext.tsximport React, { createContext, useContext, useState, useEffect } from 'react';import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

    throw new Error('useTheme must be used within a ThemeProvider');

  }    text: '#F8F9FA',

  return context;

};  },    text: '#212529',



export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {};

  const [isDarkMode, setIsDarkMode] = useState(false);

  },  colors: {

  const toggleTheme = () => {

    setIsDarkMode(prev => !prev);const ThemeContext = createContext<{

  };

  isDarkMode: boolean;};

  const currentTheme = isDarkMode ? darkTheme : theme;

  toggleTheme: () => void;

  return (

    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>} | undefined>(undefined);    primary: '#1E88E5',const lightTheme: DefaultTheme = {

      <StyledThemeProvider theme={currentTheme}>

        <GlobalStyles />

        {children}

      </StyledThemeProvider>export const useTheme = () => {const darkTheme: DefaultTheme = {

    </ThemeContext.Provider>

  );  const context = useContext(ThemeContext);

};
  if (!context) {  colors: {    secondary: '#6C757D',

    throw new Error('useTheme must be used within a ThemeProvider');

  }    primary: '#90CAF9',

  return context;

};    secondary: '#ADB5BD',    background: '#FFFFFF',  colors: {



export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {    background: '#212529',

  const [isDarkMode, setIsDarkMode] = useState(false);

    text: '#F8F9FA',    text: '#212529',

  const toggleTheme = () => {

    setIsDarkMode(prev => !prev);  },

  };

};  },    primary: '#1E88E5',

  const theme = isDarkMode ? darkTheme : lightTheme;



  return (

    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>interface ThemeContextType {};

      <StyledThemeProvider theme={theme}>

        {children}  isDarkMode: boolean;

      </StyledThemeProvider>

    </ThemeContext.Provider>  toggleTheme: () => void;    secondary: '#6C757D',const lightTheme: DefaultTheme = {import { ThemeProvider as StyledThemeProvider, DefaultTheme } from 'styled-components';

  );

};}

const darkTheme: DefaultTheme = {

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

  colors: {    background: '#FFFFFF',

export const useTheme = () => {

  const context = useContext(ThemeContext);    primary: '#90CAF9',

  if (!context) {

    throw new Error('useTheme must be used within a ThemeProvider');    secondary: '#ADB5BD',    text: '#212529',  colors: {

  }

  return context;    background: '#212529',

};

    text: '#F8F9FA',  },

interface ThemeProviderProps {

  children: ReactNode;  },

}

};};    primary: '#1E88E5',import { ThemeProvider as StyledThemeProvider } from 'styled-components'

export const ThemeProvider = ({ children }: ThemeProviderProps) => {

  const [isDarkMode, setIsDarkMode] = useState(false);



  const toggleTheme = () => {interface ThemeContextType {

    setIsDarkMode(prev => !prev);

  };  isDarkMode: boolean;



  const theme = isDarkMode ? darkTheme : lightTheme;  toggleTheme: () => void;const darkTheme: DefaultTheme = {    secondary: '#6C757D',



  return (}

    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>

      <StyledThemeProvider theme={theme}>  colors: {

        {children}

      </StyledThemeProvider>const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

    </ThemeContext.Provider>

  );    primary: '#90CAF9',    background: '#FFFFFF',const lightTheme: DefaultTheme = {

};
export const useTheme = () => {

  const context = useContext(ThemeContext);    secondary: '#ADB5BD',

  if (!context) {

    throw new Error('useTheme must be used within a ThemeProvider');    background: '#212529',    text: '#212529',

  }

  return context;    text: '#F8F9FA',

};

  },  },  colors: {import { ThemeProvider as StyledThemeProvider, DefaultTheme } from 'styled-components'

interface ThemeProviderProps {

  children: ReactNode;};

}

};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {

  const [isDarkMode, setIsDarkMode] = useState(false);interface ThemeContextType {



  const toggleTheme = () => {  isDarkMode: boolean;    primary: '#1E88E5',

    setIsDarkMode(prev => !prev);

  };  toggleTheme: () => void;



  const theme = isDarkMode ? darkTheme : lightTheme;}const darkTheme: DefaultTheme = {



  return (

    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>

      <StyledThemeProvider theme={theme}>const ThemeContext = createContext<ThemeContextType | undefined>(undefined);  colors: {    secondary: '#6C757D',const ThemeContext = createContext({

        {children}

      </StyledThemeProvider>

    </ThemeContext.Provider>

  );export const useTheme = () => {    primary: '#90CAF9',

};
  const context = useContext(ThemeContext);

  if (!context) {    secondary: '#ADB5BD',    background: '#FFFFFF',

    throw new Error('useTheme must be used within a ThemeProvider');

  }    background: '#212529',

  return context;

};    text: '#F8F9FA',    text: '#212529',  darkMode: false,import React, { createContext, useContext, useState, useEffect } from 'react';



interface ThemeProviderProps {  },

  children: ReactNode;

}};  },



export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {

  const [isDarkMode, setIsDarkMode] = useState(false);

interface ThemeContextType {};  toggleDarkMode: () => {}

  const toggleTheme = () => {

    setIsDarkMode(prev => !prev);  isDarkMode: boolean;

  };

  toggleTheme: () => void;

  const theme = isDarkMode ? darkTheme : lightTheme;

}

  return (

    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>const darkTheme: DefaultTheme = {})interface ThemeContextType {

      <StyledThemeProvider theme={theme}>

        {children}const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

      </StyledThemeProvider>

    </ThemeContext.Provider>  colors: {

  );

};export const useTheme = () => {

  const context = useContext(ThemeContext);    primary: '#90CAF9',

  if (!context) {

    throw new Error('useTheme must be used within a ThemeProvider');    secondary: '#ADB5BD',

  }

  return context;    background: '#212529',export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {  isDark: booleanimport { ThemeProvider as StyledThemeProvider } from 'styled-components';import { ThemeProvider as StyledThemeProvider } from 'styled-components';

};

    text: '#F8F9FA',

interface ThemeProviderProps {

  children: ReactNode;  },  const [darkMode, setDarkMode] = useState(false)

}

};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {

  const [isDarkMode, setIsDarkMode] = useState(false);  toggleTheme: () => void



  const toggleTheme = () => {interface ThemeContextType {

    setIsDarkMode(prev => !prev);

  };  isDarkMode: boolean;  const theme = {



  const theme = isDarkMode ? darkTheme : lightTheme;  toggleTheme: () => void;



  return (}    colors: {}import type { DefaultTheme } from 'styled-components';

    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>

      <StyledThemeProvider theme={theme}>

        {children}

      </StyledThemeProvider>const ThemeContext = createContext<ThemeContextType | undefined>(undefined);      primary: darkMode ? '#60a5fa' : '#3b82f6',

    </ThemeContext.Provider>

  );

};
export const useTheme = () => {      secondary: darkMode ? '#8b5cf6' : '#6d28d9',

  const context = useContext(ThemeContext);

  if (!context) {      background: darkMode ? '#111827' : '#f9fafb',

    throw new Error('useTheme must be used within a ThemeProvider');

  }      text: darkMode ? '#f9fafb' : '#111827'const ThemeContext = createContext<ThemeContextType>({import type { DefaultTheme } from 'styled-components';import { ThemeProvider as StyledThemeProvider } from 'styled-components';

  return context;

};    }



interface ThemeProviderProps {  }  isDark: false,

  children: ReactNode;

}



export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {  return (  toggleTheme: () => undefinedtype ThemeContextType = {

  const [isDarkMode, setIsDarkMode] = useState(false);

    <ThemeContext.Provider value={{ darkMode, toggleDarkMode: () => setDarkMode(prev => !prev) }}>

  const toggleTheme = () => {

    setIsDarkMode(prev => !prev);      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>})

  };

    </ThemeContext.Provider>

  const theme = isDarkMode ? darkTheme : lightTheme;

  )  isDark: boolean;

  return (

    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>}

      <StyledThemeProvider theme={theme}>

        {children}export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {

      </StyledThemeProvider>

    </ThemeContext.Provider>export const useTheme = () => useContext(ThemeContext)

  );  const [isDark, setIsDark] = useState(() => {  toggleTheme: () => void;

};
    const saved = localStorage.getItem('darkMode')

    return saved ? JSON.parse(saved) : false};type ThemeContextType = {import { DefaultTheme } from 'styled-components';import { ThemeProvider as StyledThemeProvider, DefaultTheme } from 'styled-components';import { ThemeProvider as StyledThemeProvider, DefaultTheme } from 'styled-components';

  })



  const toggleTheme = () => setIsDark(prev => !prev)

interface ThemeProviderProps {  isDark: boolean;

  useEffect(() => {

    localStorage.setItem('darkMode', JSON.stringify(isDark))  children: React.ReactNode;

  }, [isDark])

}  toggleTheme: () => void;

  const theme: DefaultTheme = {

    colors: {

      primary: isDark ? '#60a5fa' : '#3b82f6',

      secondary: isDark ? '#8b5cf6' : '#6d28d9',const ThemeContext = createContext<ThemeContextType | undefined>(undefined);};

      background: isDark ? '#111827' : '#f9fafb',

      surface: isDark ? '#1f2937' : '#ffffff',

      text: isDark ? '#f9fafb' : '#111827',

      textSecondary: isDark ? '#9ca3af' : '#6b7280',const baseTheme = {interface ThemeContextType {

      border: isDark ? '#374151' : '#e5e7eb',

      error: isDark ? '#ef4444' : '#dc2626',  spacing: {

      success: isDark ? '#10b981' : '#059669',

      warning: isDark ? '#f59e0b' : '#d97706',    xs: '0.25rem',interface ThemeProviderProps {

      info: isDark ? '#3b82f6' : '#2563eb',

    }    sm: '0.5rem',

  }

    md: '1rem',  children: React.ReactNode;  darkMode: boolean;

  return (

    <ThemeContext.Provider value={{ isDark, toggleTheme }}>    lg: '1.5rem',

      <StyledThemeProvider theme={theme}>

        {children}    xl: '2rem'}

      </StyledThemeProvider>

    </ThemeContext.Provider>  },

  )

}  fonts: {  toggleDarkMode: () => void;interface ThemeContextType {interface Props {



export const useTheme = () => useContext(ThemeContext)    sizes: {

      xs: '0.75rem',const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

      sm: '0.875rem',

      md: '1rem',}

      lg: '1.125rem',

      xl: '1.25rem'const baseTheme = {

    },

    weights: {  spacing: {  darkMode: boolean;  children: ReactNode;

      light: 300,

      regular: 400,    xs: '0.25rem',

      medium: 500,

      semibold: 600,    sm: '0.5rem',interface Props {

      bold: 700

    },    md: '1rem',

    families: {

      primary: '"Inter", system-ui, sans-serif',    lg: '1.5rem',  children: ReactNode;  toggleDarkMode: () => void;}

      secondary: '"Fira Code", Monaco, Consolas, monospace'

    }    xl: '2rem'

  },

  radii: {  },}

    sm: '0.25rem',

    md: '0.375rem',  fonts: {

    lg: '0.5rem',

    xl: '0.75rem'    sizes: {}

  },

  shadows: {      xs: '0.75rem',

    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',      sm: '0.875rem',export const ThemeContext = createContext<ThemeContextType>({

    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'

  },      md: '1rem',

  breakpoints: {

    mobile: '640px',      lg: '1.125rem',  darkMode: false,interface ThemeContextType {

    tablet: '768px',

    desktop: '1024px',      xl: '1.25rem'

    wide: '1280px'

  },    },  toggleDarkMode: () => {},

  zIndices: {

    dropdown: 1000,    weights: {

    modal: 1100,

    tooltip: 1200,      light: 300,});export const ThemeContext = createContext<ThemeContextType>({  darkMode: boolean;

    toast: 1300

  }      regular: 400,

};

      medium: 500,

const lightColors = {

  primary: '#3b82f6',      semibold: 600,

  secondary: '#6d28d9',

  background: '#f9fafb',      bold: 700export const ThemeProvider: React.FC<Props> = ({ children }) => {  darkMode: false,  toggleDarkMode: () => void;

  surface: '#ffffff',

  text: '#111827',    },

  textSecondary: '#6b7280',

  border: '#e5e7eb',    families: {  const [darkMode, setDarkMode] = useState(() => {

  error: '#dc2626',

  success: '#059669',      primary: '"Inter", system-ui, sans-serif',

  warning: '#d97706',

  info: '#2563eb'      secondary: '"Fira Code", Monaco, Consolas, monospace'    const savedMode = localStorage.getItem('darkMode');  toggleDarkMode: () => {},}

};

    }

const darkColors = {

  primary: '#60a5fa',  },    return savedMode ? JSON.parse(savedMode) : false;

  secondary: '#8b5cf6',

  background: '#111827',  radii: {

  surface: '#1f2937',

  text: '#f9fafb',    sm: '0.25rem',  });});

  textSecondary: '#9ca3af',

  border: '#374151',    md: '0.375rem',

  error: '#ef4444',

  success: '#10b981',    lg: '0.5rem',

  warning: '#f59e0b',

  info: '#3b82f6'    xl: '0.75rem'

};

  },  const toggleDarkMode = () => {export const ThemeContext = createContext<ThemeContextType>({

export const ThemeProvider = ({ children }: ThemeProviderProps) => {

  const [isDark, setIsDark] = useState(() => {  shadows: {

    const saved = localStorage.getItem('darkMode');

    return saved ? JSON.parse(saved) : false;    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',    setDarkMode((prev: boolean) => !prev);

  });

    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',

  const toggleTheme = () => setIsDark(prev => !prev);

    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'  };interface Props {  darkMode: false,

  useEffect(() => {

    localStorage.setItem('darkMode', JSON.stringify(isDark));  },

  }, [isDark]);

  breakpoints: {

  const theme: DefaultTheme = {

    isDark,    mobile: '640px',

    colors: isDark ? darkColors : lightColors,

    ...baseTheme    tablet: '768px',  useEffect(() => {  children: ReactNode;  toggleDarkMode: () => {},

  };

    desktop: '1024px',

  return (

    <ThemeContext.Provider value={{ isDark, toggleTheme }}>    wide: '1280px'    localStorage.setItem('darkMode', JSON.stringify(darkMode));

      <StyledThemeProvider theme={theme}>

        {children}  },

      </StyledThemeProvider>

    </ThemeContext.Provider>  zIndices: {  }, [darkMode]);}});

  );

};    dropdown: 1000,



export const useTheme = () => {    modal: 1100,

  const context = useContext(ThemeContext);

  if (!context) {    tooltip: 1200,

    throw new Error('useTheme must be used within a ThemeProvider');

  }    toast: 1300  const theme: DefaultTheme = {

  return context;

};  }

};    mode: darkMode ? 'dark' : 'light',



const lightColors = {    colors: {export const ThemeProvider: React.FC<Props> = ({ children }) => {export const ThemeProvider = ({ children }: Props) => {

  primary: '#3b82f6',

  secondary: '#6d28d9',      primary: darkMode ? '#60a5fa' : '#3b82f6',

  background: '#f9fafb',

  surface: '#ffffff',      secondary: darkMode ? '#8b5cf6' : '#6d28d9',  const [darkMode, setDarkMode] = useState(() => {  const [darkMode, setDarkMode] = useState(() => {

  text: '#111827',

  textSecondary: '#6b7280',      background: darkMode ? '#111827' : '#f9fafb',

  border: '#e5e7eb',

  error: '#dc2626',      surface: darkMode ? '#1f2937' : '#ffffff',    const savedMode = localStorage.getItem('darkMode');    const savedMode = localStorage.getItem('darkMode');

  success: '#059669',

  warning: '#d97706',      text: darkMode ? '#f9fafb' : '#111827',

  info: '#2563eb'

};      textSecondary: darkMode ? '#9ca3af' : '#6b7280',    return savedMode ? JSON.parse(savedMode) : false;    return savedMode ? JSON.parse(savedMode) : false;



const darkColors = {      border: darkMode ? '#374151' : '#e5e7eb',

  primary: '#60a5fa',

  secondary: '#8b5cf6',      error: darkMode ? '#ef4444' : '#dc2626',  });  });

  background: '#111827',

  surface: '#1f2937',      success: darkMode ? '#10b981' : '#059669',

  text: '#f9fafb',

  textSecondary: '#9ca3af',      warning: darkMode ? '#f59e0b' : '#d97706',

  border: '#374151',

  error: '#ef4444',      info: darkMode ? '#3b82f6' : '#2563eb'

  success: '#10b981',

  warning: '#f59e0b',    },  const toggleDarkMode = () => {  const toggleDarkMode = () => {

  info: '#3b82f6'

};    spacing: {



export const ThemeProvider = ({ children }: ThemeProviderProps) => {      xs: '0.25rem',    setDarkMode((prev: boolean) => !prev);    setDarkMode((prev: boolean) => !prev);

  const [isDark, setIsDark] = useState(() => {

    const saved = localStorage.getItem('darkMode');      sm: '0.5rem',

    return saved ? JSON.parse(saved) : false;

  });      md: '1rem',  };  };



  const toggleTheme = () => setIsDark(prev => !prev);      lg: '1.5rem',



  useEffect(() => {      xl: '2rem'

    localStorage.setItem('darkMode', JSON.stringify(isDark));

  }, [isDark]);    },



  const theme: DefaultTheme = {    fontSize: {  useEffect(() => {  useEffect(() => {

    isDark,

    colors: isDark ? darkColors : lightColors,      xs: '0.75rem',

    ...baseTheme

  };      sm: '0.875rem',    localStorage.setItem('darkMode', JSON.stringify(darkMode));    localStorage.setItem('darkMode', JSON.stringify(darkMode));



  return (      md: '1rem',

    <ThemeContext.Provider value={{ isDark, toggleTheme }}>

      <StyledThemeProvider theme={theme}>      lg: '1.125rem',  }, [darkMode]);    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');

        {children}

      </StyledThemeProvider>      xl: '1.25rem'

    </ThemeContext.Provider>

  );    },  }, [darkMode]);

};

    fontWeight: {

export const useTheme = () => {

  const context = useContext(ThemeContext);      light: 300,  const theme: DefaultTheme = {

  if (!context) {

    throw new Error('useTheme must be used within a ThemeProvider');      regular: 400,

  }

  return context;      medium: 500,    mode: darkMode ? 'dark' : 'light',  const theme: DefaultTheme = {

};
      semibold: 600,

      bold: 700    colors: {    mode: darkMode ? 'dark' : 'light',

    },

    fontFamily: {      primary: darkMode ? '#60a5fa' : '#3b82f6',    colors: {

      primary: '"Inter", system-ui, sans-serif',

      secondary: '"Fira Code", Monaco, Consolas, monospace'      secondary: darkMode ? '#8b5cf6' : '#6d28d9',      primary: darkMode ? '#60a5fa' : '#3b82f6',

    },

    borderRadius: {      background: darkMode ? '#111827' : '#f9fafb',      secondary: darkMode ? '#8b5cf6' : '#6d28d9',

      sm: '0.25rem',

      md: '0.375rem',      surface: darkMode ? '#1f2937' : '#ffffff',      background: darkMode ? '#111827' : '#f9fafb',

      lg: '0.5rem',

      xl: '0.75rem'      text: darkMode ? '#f9fafb' : '#111827',      surface: darkMode ? '#1f2937' : '#ffffff',

    },

    shadows: {      textSecondary: darkMode ? '#9ca3af' : '#6b7280',      text: darkMode ? '#f9fafb' : '#111827',

      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',      border: darkMode ? '#374151' : '#e5e7eb',      textSecondary: darkMode ? '#9ca3af' : '#6b7280',

      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'

    },      error: darkMode ? '#ef4444' : '#dc2626',      border: darkMode ? '#374151' : '#e5e7eb',

    breakpoints: {

      mobile: '640px',      success: darkMode ? '#10b981' : '#059669',      error: darkMode ? '#ef4444' : '#dc2626',

      tablet: '768px',

      desktop: '1024px',      warning: darkMode ? '#f59e0b' : '#d97706',      success: darkMode ? '#10b981' : '#059669',

      wide: '1280px'

    },      info: darkMode ? '#3b82f6' : '#2563eb'      warning: darkMode ? '#f59e0b' : '#d97706',

    zIndex: {

      dropdown: 1000,    },      info: darkMode ? '#3b82f6' : '#2563eb'

      modal: 1100,

      tooltip: 1200,    spacing: {    },

      toast: 1300

    }      xs: '0.25rem',    spacing: {

  };

      sm: '0.5rem',      xxs: '0.125rem',

  return (

    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>      md: '1rem',      xs: '0.25rem',

      <StyledThemeProvider theme={theme}>

        {children}      lg: '1.5rem',      sm: '0.5rem',

      </StyledThemeProvider>

    </ThemeContext.Provider>      xl: '2rem'      md: '1rem',

  );

};    },      lg: '1.5rem',



export const useTheme = () => {    fontSize: {      xl: '2rem'

  const context = useContext(ThemeContext);

  if (!context) {      xs: '0.75rem',    },

    throw new Error('useTheme must be used within a ThemeProvider');

  }      sm: '0.875rem',    typography: {

  return context;

};      md: '1rem',      fonts: {

      lg: '1.125rem',        primary: '"Inter", system-ui, sans-serif',

      xl: '1.25rem'        secondary: '"Fira Code", Monaco, Consolas, monospace'

    },      },

    fontWeight: {      sizes: {

      light: 300,        xs: '0.75rem',

      regular: 400,        sm: '0.875rem',

      medium: 500,        md: '1rem',

      semibold: 600,        lg: '1.125rem',

      bold: 700        xl: '1.25rem'

    },      },

    fontFamily: {      weights: {

      primary: '"Inter", system-ui, sans-serif',        light: 300,

      secondary: '"Fira Code", Monaco, Consolas, monospace'        regular: 400,

    },        medium: 500,

    borderRadius: {        semibold: 600,

      sm: '0.25rem',        bold: 700

      md: '0.375rem',      }

      lg: '0.5rem',    },

      xl: '0.75rem'    radii: {

    },      none: '0',

    shadows: {      sm: '0.25rem',

      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',      md: '0.375rem',

      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',      lg: '0.5rem',

      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'      xl: '0.75rem',

    },      full: '9999px'

    breakpoints: {    },

      mobile: '640px',    shadows: {

      tablet: '768px',      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

      desktop: '1024px',      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',

      wide: '1280px'      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'

    },    },

    zIndex: {    breakpoints: {

      dropdown: 1000,      mobile: '640px',

      modal: 1100,      tablet: '768px',

      tooltip: 1200,      desktop: '1024px',

      toast: 1300      wide: '1280px'

    }    },

  };    zIndex: {

      dropdown: 1000,

  return (      modal: 1100,

    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>      tooltip: 1200,

      <StyledThemeProvider theme={theme}>      toast: 1300

        {children}    }

      </StyledThemeProvider>  };

    </ThemeContext.Provider>

  );  return (

};    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>

      <StyledThemeProvider theme={theme}>

export const useTheme = () => {        {children}

  const context = useContext(ThemeContext);      </StyledThemeProvider>

  if (!context) {    </ThemeContext.Provider>

    throw new Error('useTheme must be used within a ThemeProvider');  );

  }};

  return context;

};export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
