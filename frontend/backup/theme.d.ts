import 'styled-components'declare module 'styled-components' {// theme.d.tsimport 'styled-components'import { DefaultTheme } from 'styled-components'import 'styled-components';import 'styled-components';



declare module 'styled-components' {  export interface DefaultTheme {

  export interface DefaultTheme {

    mode: 'light' | 'dark'    colors: {import 'styled-components'

    colors: {

      primary: string      primary: string

      secondary: string

      background: string      secondary: string

      surface: string

      text: string      background: string

      textSecondary: string

      border: string      surface: stringdeclare module 'styled-components' {

      error: string

      success: string      text: string

      warning: string

      info: string      textSecondary: string  export interface DefaultTheme {declare module 'styled-components' {

    }

    spacing: {      border: string

      xxs: string

      xs: string      error: string    colors: {

      sm: string

      md: string      success: string

      lg: string

      xl: string      warning: string      primary: string  export interface DefaultTheme {

    }

    typography: {      info: string

      fonts: {

        primary: string    }      secondary: string

        secondary: string

      }    typography: {

      sizes: {

        xs: string      fontSize: {      background: string    colors: {declare module 'styled-components' {

        sm: string

        md: string        xs: string

        lg: string

        xl: string        sm: string      surface: string

      }

      weights: {        md: string

        light: number

        regular: number        lg: string      text: string      primary: string

        medium: number

        semibold: number        xl: string

        bold: number

      }        xxl: string      textSecondary: string

    }

    radii: {      }

      none: string

      sm: string      fontWeight: {      border: string      secondary: string  export interface DefaultTheme {

      md: string

      lg: string        light: number

      xl: string

      full: string        regular: number      error: string

    }

    shadows: {        medium: number

      sm: string

      md: string        semibold: number      success: string      background: string

      lg: string

    }        bold: number

    breakpoints: {

      mobile: string      }      warning: string

      tablet: string

      desktop: string      fontFamily: {

      wide: string

    }        primary: string      info: string      surface: string    colors: {declare module 'styled-components' {declare module 'styled-components' {

    zIndex: {

      dropdown: number        secondary: string

      modal: number

      tooltip: number      }    }

      toast: number

    }    }

  }

}    spacing: {    typography: {      text: string

      xs: string

      sm: string      fontSize: {

      md: string

      lg: string        xs: string      textSecondary: string      primary: string

      xl: string

      xxl: string        sm: string

    }

    borderRadius: {        md: string      border: string

      sm: string

      md: string        lg: string

      lg: string

      xl: string        xl: string      error: string      secondary: string  export interface DefaultTheme {  export interface DefaultTheme {

    }

    shadows: {      }

      sm: string

      md: string      fontWeight: {      success: string

      lg: string

    }        light: number

    breakpoints: {

      mobile: string        regular: number      warning: string      background: string

      tablet: string

      desktop: string        medium: number

      wide: string

    }        semibold: number      info: string

    zIndex: {

      dropdown: number        bold: number

      modal: number

      tooltip: number      }    }      surface: string    colors: {    colors: {

      toast: number

    }      fontFamily: {

  }

}        primary: string    spacing: {

        secondary: string

      }      xs: string      text: string

    }

    spacing: {      sm: string

      xs: string

      sm: string      md: string      textSecondary: string      primary: string;      primary: string;

      md: string

      lg: string      lg: string

      xl: string

    }      xl: string      border: string

    borderRadius: {

      sm: string      xxl: string

      md: string

      lg: string    }      error: string      secondary: string;      secondary: string;

      xl: string

    }    typography: {

    shadows: {

      sm: string      fontSize: {      success: string

      md: string

      lg: string        xs: string

    }

    breakpoints: {        sm: string      warning: string      background: string;      background: string;

      mobile: string

      tablet: string        md: string

      desktop: string

      wide: string        lg: string      info: string

    }

    zIndex: {        xl: string

      dropdown: number

      modal: number        xxl: string    }      surface: string;      surface: string;

      tooltip: number

      toast: number      }

    }

  }      fontWeight: {    spacing: {

}
        light: number

        regular: number      xs: string      text: string;      text: string;

        medium: number

        semibold: number      sm: string

        bold: number

      }      md: string      textSecondary: string;      textSecondary: string;

      fontFamily: {

        primary: string      lg: string

        secondary: string

      }      xl: string      border: string;      border: string;

    }

    borderRadius: {      xxl: string

      sm: string

      md: string    }      error: string;      error: string;

      lg: string

      xl: string    typography: {

    }

    shadows: {      fontSize: {      success: string;      success: string;

      sm: string

      md: string        xs: string

      lg: string

    }        sm: string      warning: string;      warning: string;

    breakpoints: {

      mobile: string        md: string

      tablet: string

      desktop: string        lg: string      info: string;      info: string;

      wide: string

    }        xl: string

    zIndex: {

      dropdown: number        xxl: string    };    };

      modal: number

      tooltip: number      }

      toast: number

    }      fontWeight: {    spacing: {    spacing: {

  }

}        light: number

        regular: number      xs: string;      xs: string;

        medium: number

        semibold: number      sm: string;      sm: string;

        bold: number

      }      md: string;      md: string;

      fontFamily: {

        primary: string      lg: string;      lg: string;

        secondary: string

      }      xl: string;      xl: string;

    }

    borderRadius: {      xxl: string;      xxl: string;

      sm: string

      md: string    };    };

      lg: string

      xl: string    typography: {    typography: {

    }

    shadows: {      fontSize: {      fontSize: {

      sm: string

      md: string        xs: string;        xs: string;

      lg: string

    }        sm: string;        sm: string;

    breakpoints: {

      mobile: string        md: string;        md: string;

      tablet: string

      desktop: string        lg: string;        lg: string;

      wide: string

    }        xl: string;        xl: string;

    zIndex: {

      dropdown: number        xxl: string;        xxl: string;

      modal: number

      tooltip: number      };      };

      toast: number

    }      fontWeight: {      fontWeight: {

  }

}        light: number;        light: number;

        regular: number;        regular: number;

        medium: number;        medium: number;

        semibold: number;        semibold: number;

        bold: number;        bold: number;

      };      };

      fontFamily: {      fontFamily: {

        primary: string;        primary: string;

        secondary: string;        secondary: string;

      };      };

    };    };

    borderRadius: {    borderRadius: {

      sm: string;      sm: string;

      md: string;      md: string;

      lg: string;      lg: string;

      xl: string;      xl: string;

    };    };

    shadows: {    shadows: {

      sm: string;      sm: string;

      md: string;      md: string;

      lg: string;      lg: string;

    };    };

    breakpoints: {    breakpoints: {

      mobile: string;      mobile: string;

      tablet: string;      tablet: string;

      desktop: string;      desktop: string;

      wide: string;      wide: string;

    };    };

    zIndex: {    zIndex: {

      dropdown: number;      dropdown: number;

      modal: number;      modal: number;

      tooltip: number;      tooltip: number;

      toast: number;      toast: number;

    };    };

  }  }

}}