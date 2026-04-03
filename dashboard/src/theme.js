import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#ec4899', // Pink
            light: '#f472b6',
            dark: '#db2777',
        },
        secondary: {
            main: '#f43f5e', // Rose
        },
        background: {
            default: '#0f172a', // Deep Slate
            paper: 'rgba(30, 41, 59, 0.7)', // Translucent Slate
        },
        text: {
            primary: '#f8fafc',
            secondary: '#94a3b8',
        },
    },
    shape: {
        borderRadius: 8,
    },
    typography: {
        fontFamily: '"Outfit", "Inter", sans-serif',
        h4: {
            fontWeight: 900,
            letterSpacing: '-0.03em',
        },
        h6: {
            fontWeight: 700,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: '#334155 #0f172a',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#0f172a',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#334155',
                        borderRadius: '4px',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        boxShadow: '0 0 30px rgba(236, 72, 153, 0.15)',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 700,
                    padding: '10px 24px',
                    borderRadius: 8,
                    transition: 'all 0.2s',
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    boxShadow: '0 10px 15px -3px rgba(236, 72, 153, 0.3)',
                    '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 0 25px rgba(236, 72, 153, 0.5)',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(15, 23, 42, 0.8) !important',
                    backdropFilter: 'blur(12px)',
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#0f172a',
                    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    margin: '6px 16px',
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                        background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0) 100%)',
                        color: '#f472b6',
                        '& .MuiListItemIcon-root': {
                            color: '#f472b6',
                            filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.5))',
                        },
                        '&:hover': {
                            backgroundColor: 'rgba(236, 72, 153, 0.2)',
                        },
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '16px',
                },
                head: {
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                },
            },
        },
    },
});

export default theme;
