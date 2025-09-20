import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* Reset */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* HTML & Body */
  html {
    font-size: 16px;
  }

  body {
    font-family: ${props => props.theme.typography.fonts.primary};
    font-size: ${props => props.theme.typography.sizes.md};
    font-weight: ${props => props.theme.typography.weights.regular};
    line-height: 1.6;
    color: ${props => props.theme.colors.text};
    background-color: ${props => props.theme.colors.background};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    line-height: 1.2;
    color: ${props => props.theme.colors.text};
    font-weight: ${props => props.theme.typography.fontWeight.bold};
    margin-bottom: ${props => props.theme.spacing.md};
  }

  h1 {
    font-size: ${props => props.theme.typography.fontSize.xxl};
  }

  h2 {
    font-size: ${props => props.theme.typography.fontSize.xl};
  }

  h3 {
    font-size: ${props => props.theme.typography.fontSize.lg};
  }

  h4 {
    font-size: ${props => props.theme.typography.fontSize.md};
  }

  h5, h6 {
    font-size: ${props => props.theme.typography.fontSize.sm};
  }

  /* Links */
  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${props => props.theme.colors.secondary};
    }
  }

  /* Lists */
  ul, ol {
    padding-left: 1.5em;
    margin-bottom: ${props => props.theme.spacing.md};
  }

  li {
    margin-bottom: ${props => props.theme.spacing.xs};
  }

  /* Code */
  code {
    font-family: ${props => props.theme.typography.fontFamily.secondary};
    font-size: 0.875em;
    background-color: ${props => props.theme.colors.surface};
    padding: 0.125rem 0.25rem;
    border-radius: ${props => props.theme.borderRadius.sm};
  }

  /* Pre */
  pre {
    font-family: ${props => props.theme.typography.fontFamily.secondary};
    background-color: ${props => props.theme.colors.surface};
    padding: ${props => props.theme.spacing.md};
    border-radius: ${props => props.theme.borderRadius.md};
    overflow-x: auto;
    margin-bottom: ${props => props.theme.spacing.md};
    border: 1px solid ${props => props.theme.colors.border};
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: ${props => props.theme.spacing.md};
  }

  th, td {
    padding: ${props => props.theme.spacing.sm};
    border-bottom: 1px solid ${props => props.theme.colors.border};
    text-align: left;
  }

  th {
    font-weight: ${props => props.theme.typography.fontWeight.semibold};
    background-color: ${props => props.theme.colors.surface};
  }

  /* Forms */
  input, select, textarea {
    font-family: inherit;
    font-size: ${props => props.theme.typography.fontSize.md};
    padding: ${props => props.theme.spacing.sm};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    background-color: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text};
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
    }

    &::placeholder {
      color: ${props => props.theme.colors.textSecondary};
    }
  }

  /* Buttons */
  button {
    cursor: pointer;
    font-family: inherit;
    font-size: ${props => props.theme.typography.fontSize.md};
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    border: 1px solid transparent;
    border-radius: ${props => props.theme.borderRadius.md};
    background-color: ${props => props.theme.colors.primary};
    color: white;
    transition: all 0.2s ease;

    &:hover {
      background-color: ${props => props.theme.colors.secondary};
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}30;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  /* Utility Classes */
  .font-mono {
    font-family: ${props => props.theme.typography.fontFamily.secondary};
  }

  .font-bold {
    font-weight: ${props => props.theme.typography.fontWeight.bold};
  }

  .text-center {
    text-align: center;
  }

  .text-right {
    text-align: right;
  }

  .text-primary {
    color: ${props => props.theme.colors.primary};
  }

  .text-secondary {
    color: ${props => props.theme.colors.textSecondary};
  }

  .text-error {
    color: ${props => props.theme.colors.error};
  }

  .text-success {
    color: ${props => props.theme.colors.success};
  }

  .text-warning {
    color: ${props => props.theme.colors.warning};
  }

  .text-info {
    color: ${props => props.theme.colors.info};
  }

  /* Responsive design */
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    html {
      font-size: 14px;
    }
  }
`;
