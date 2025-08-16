export const globalStyles = `
  :root {
    /* Theme color variables - light mode defaults */
    --color-primary: #2563eb; /* blue-600 */
    --color-primary-dark: #1e40af;
    --color-primary-light: #60a5fa;
    --color-accent: #38bdf8; /* sky-400 */

    --color-background: #f3f4f6; /* gray-100 */
    --color-surface: #ffffff;
    --color-card-background: rgba(255, 255, 255, 0.8);
    --color-overlay: rgba(0, 0, 0, 0.04);

    --color-text: #0f172a; /* slate-900 */
    --color-text-secondary: #334155; /* slate-700 */
    --color-text-light: #64748b; /* slate-500 */
    --color-text-muted: #94a3b8; /* slate-400 */
    --color-text-on-dark: #f8fafc;

    --color-success: #22c55e;
    --color-error: #ef4444;
    --color-warning: #f59e0b;
    --color-info: #3b82f6;

    --color-border: #e5e7eb;
    --color-border-light: rgba(15, 23, 42, 0.08);
    --color-border-dark: #cbd5e1;

    --color-nav-background: rgba(255, 255, 255, 0.9);
    --color-nav-text: #475569;
    --color-nav-text-active: #0f172a;
    --color-nav-hover: rgba(15, 23, 42, 0.06);
  }

  .dark {
    /* Dark mode overrides */
    --color-primary: #2ea0f4; /* bright blue */
    --color-primary-dark: #1f6fd1;
    --color-primary-light: #60a5fa;
    --color-accent: #7dd3fc; /* sky-300 */

    --color-background: #0b1220; /* deep navy */
    --color-surface: #0f172a; /* slate-900 */
    --color-card-background: rgba(17, 24, 39, 0.6); /* glass */
    --color-overlay: rgba(255, 255, 255, 0.06);

    --color-text: #e5edf5; /* near-white */
    --color-text-secondary: #b6c2d6;
    --color-text-light: #8ca0bb;
    --color-text-muted: #94a3b8;

    --color-border: #1f2937; /* gray-800 */
    --color-border-light: rgba(148, 163, 184, 0.18);
    --color-border-dark: #0b1220;

    --color-nav-background: rgba(11, 18, 32, 0.85);
    --color-nav-text: #9aa8c7;
    --color-nav-text-active: #ffffff;
    --color-nav-hover: rgba(255, 255, 255, 0.06);
  }

  /* Global hover effects and transitions for web */
  @media (hover: hover) {
    /* Back button hover */
    div[style*="transition: all 0.2s ease"]:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(17, 163, 208, 0.15);
    }
    
    /* Primary buttons hover */
    div[style*="backgroundColor: rgb(17, 163, 208)"]:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    /* Secondary buttons hover */
    div[style*="borderColor: rgb(17, 163, 208)"]:hover {
      background-color: rgba(17, 163, 208, 0.05);
    }
    
    /* Entry items hover */
    div[style*="borderRadius: 12px"][style*="position: relative"]:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }
    
    /* Social action buttons hover */
    div[style*="borderRadius: 9999px"][style*="flexDirection: row"]:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    
    /* Link hover effects */
    span[style*="textDecorationLine: underline"]:hover {
      opacity: 0.8;
    }
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Custom scrollbar styling */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 8px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.35);
    border-radius: 8px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary);
  }
  
  /* Focus styles for accessibility */
  button:focus-visible,
  div[role="button"]:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
  
  /* Textarea focus enhancement */
  textarea:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
  
  /* Animation for entry appearance */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Apply animation to new entries */
  div[style*="position: relative"][style*="marginBottom"] {
    animation: fadeInUp 0.3s ease-out;
  }
`;
