// frontend/src/components/Account/AccountLayout.tsx
'use client'; // --- CRITICAL: Mark as Client Component ---

import React, { useState } from 'react'; // Ensure React is imported
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Button,
  // --- Import MUI components used in the layout ---
  Container,
  Card,
  CardContent,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountCircle as AccountCircleIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';
import { signOut, useSession } from 'next-auth/react'; // Import useSession

// --- CRITICAL: Ensure correct type for activeSection prop ---
interface AccountLayoutProps {
  children: React.ReactNode;
  activeSection: string; // Explicitly type the activeSection prop
}

// --- CRITICAL: Define the component as a standard arrow function ---
const AccountLayout: React.FC<AccountLayoutProps> = ({ children, activeSection }) => {
  // --- CRITICAL: Use hooks at the TOP LEVEL of the component ---
  const {  data:session, status } = useSession(); // Use useSession hook correctly
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // --- CRITICAL: Define handler functions at the TOP LEVEL ---
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut({ callbackUrl: '/login' });
  };

  // --- ROLE-BASED NAVIGATION ITEMS ---
  // --- CRITICAL: Define navItems inside the component, after hooks ---
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, href: '/account/dashboard', roles: ['member', 'billing_manager', 'admin'] },
    { text: 'Profile', icon: <AccountCircleIcon />, href: '/account/profile', roles: ['member', 'billing_manager', 'admin'] },
    { text: 'Billing', icon: <PaymentIcon />, href: '/account/billing', roles: ['member', 'billing_manager', 'admin'] }, // Members can manage their own billing
    // --- ROLE-SPECIFIC ITEMS ---
    { text: 'Users', icon: <PeopleIcon />, href: '/account/users', roles: ['admin'] }, // Only admins manage users
    { text: 'Settings', icon: <SettingsIcon />, href: '/account/settings', roles: ['admin'] }, // Only admins manage tenant settings
  ].filter(item => item.roles.includes(session?.user?.role || 'member')); // Filter based on user role
  // --- END ROLE-BASED NAVIGATION ---

  // --- CRITICAL: Define drawer content inside the component ---
  const drawer = (
    <div>
      {/* --- CRITICAL: Use Box instead of deprecated Toolbar offset hack --- */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, minHeight: 64 }}> {/* Approximate height of AppBar */}
        <IconButton onClick={handleDrawerToggle} sx={{ mr: 2 }}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div" sx={{ ml: 2, flexGrow: 1 }}>
          SaaS Billing
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => {
          // --- FIX: Determine if this item is active ---
          const isActive = item.text === activeSection;
          
          return (
            // --- FIX: Use ListItem correctly with component="a" and href ---
            <ListItem
              key={item.text}
              component="a" // Use anchor tag for navigation
              href={item.href} // Provide the link destination
              // --- FIX: Apply selected styles via sx, not selected prop ---
              sx={{
                // --- FIX: Apply selected styles via sx ---
                ...(isActive && {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'inherit', // Inherit color for icon
                  },
                  '&:hover': {
                    backgroundColor: 'primary.dark', // Darker hover on selected item
                  },
                }),
                // --- FIX: Apply general hover styles via sx ---
                '&:hover': {
                  backgroundColor: 'action.hover', // MUI's default hover color
                },
                // --- FIX: Apply padding and transition via sx ---
                px: 2,
                py: 1.5,
                borderRadius: 1, // Optional: Add rounded corners
                transition: 'background-color 0.3s ease, color 0.3s ease', // Smooth transition
              }}
            >
              <ListItemIcon
                sx={{
                  // --- FIX: Ensure icon inherits color correctly ---
                  color: 'inherit',
                  minWidth: 40, // Adjust icon spacing
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  // --- FIX: Ensure text styles are consistent ---
                  sx: {
                    fontWeight: isActive ? 'bold' : 'normal', // Bold active text
                  },
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </div>
  );
  // --- END drawer content ---

  // --- CRITICAL: Return valid JSX ---
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* --- AppBar --- */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - 240px)` }, // 240px is drawerWidth
          ml: { sm: `240px` }, // 240px is drawerWidth
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {activeSection}
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{session?.user?.email}</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToAppIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      {/* --- END AppBar --- */}

      {/* --- Drawer --- */}
      <Box
        component="nav"
        sx={{ width: { sm: 240 }, flexShrink: { sm: 0 } }} // 240px is drawerWidth
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 }, // 240px is drawerWidth
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 }, // 240px is drawerWidth
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      {/* --- END Drawer --- */}

      {/* --- Main Content --- */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }} // 240px is drawerWidth
      >
        {/* --- CRITICAL: Offset for fixed AppBar --- */}
        <Box sx={{ minHeight: 64 }} /> {/* Approximate height of AppBar */}
        {children}
      </Box>
      {/* --- END Main Content --- */}
    </Box>
  );
  // --- END Return JSX ---
};

// --- CRITICAL: Export the component as default ---
export default AccountLayout;