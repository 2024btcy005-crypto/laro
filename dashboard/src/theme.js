import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#006d33', // Dark Laro Green
            light: '#43d174', // Vibrant Laro Green Accent
            dark: '#004d23',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#111827', // Dark Charcoal
        },
        background: {
            default: '#f8f9fb', // Light Soft Gray
            paper: '#ffffff', // Crisp White Cards
        },
        text: {
            primary: '#111827',
            secondary: '#6b7280',
        },
        divider: '#e5e7eb',
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
        h4: {
            fontWeight: 800,
            letterSpacing: '-0.02em',
        },
        h6: {
            fontWeight: 700,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#f8f9fb',
                    color: '#111827',
                    scrollbarColor: '#cbd5e1 #f8f9fb',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f8f9fb',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#cbd5e1',
                        borderRadius: '4px',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                    borderRadius: 16,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        borderColor: '#43d174',
                        boxShadow: '0 4px 12px 0 rgba(0, 109, 51, 0.08)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 700,
                    padding: '10px 20px',
                    borderRadius: 10,
                    transition: 'all 0.2s ease',
                },
                containedPrimary: {
                    backgroundColor: '#006d33',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(0, 109, 51, 0.2)',
                    '&:hover': {
                        backgroundColor: '#005526',
                        boxShadow: '0 6px 16px rgba(0, 109, 51, 0.3)',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #f3f4f6',
                    padding: '14px 16px',
                    color: '#111827',
                },
                head: {
                    fontWeight: 800,
                    color: '#6b7280',
                    backgroundColor: '#f9fafb',
                    fontSize: '11px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    border: '1px solid #e5e7eb',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                        backgroundColor: '#ffffff',
                    },
                },
            },
        },
    },
});

export default theme;
