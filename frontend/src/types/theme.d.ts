import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    mode: 'light' | 'dark';
    
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      error: string;
      success: string;
      warning: string;
      info: string;
    };

    spacing: {
      xxs: string;
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };

    typography: {
      fonts: {
        primary: string;
        secondary: string;
      };
      fontSize: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
      };
      fontWeight: {
        light: number;
        regular: number;
        medium: number;
        semibold: number;
        bold: number;
      };
      fontFamily: {
        primary: string;
        secondary: string;
      };
    };

    radii: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
    };

    shadows: {
      sm: string;
      md: string;
      lg: string;
    };

    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
      wide: string;
    };

    zIndex: {
      dropdown: number;
      modal: number;
      tooltip: number;
      toast: number;
    };
  }
}