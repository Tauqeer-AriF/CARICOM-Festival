import { AdminUser, AdminRole } from '../types';

const ADMIN_USERS_STORAGE_KEY = 'grenada_admin_users_db';
const CURRENT_AUTH_USER_KEY = 'grenada_current_admin_user';

export type AdminTabId = 
  | 'owner'
  | 'analytics' 
  | 'submissions' 
  | 'orders' 
  | 'emails'
  | 'branding' 
  | 'page-images' 
  | 'events' 
  | 'gallery' 
  | 'passes' 
  | 'hotels' 
  | 'testimonials' 
  | 'media' 
  | 'users' 
  | 'system' 
  | 'backup';

/**
 * Role-Based Access Control (RBAC) Permissions Matrix
 * Defines which console tabs/modules each role has authorization to access.
 */
export const ROLE_PERMISSIONS: Record<AdminRole, AdminTabId[]> = {
  'Owner': [
    'owner',
    'analytics', 
    'submissions', 
    'orders', 
    'emails',
    'branding', 
    'page-images', 
    'events', 
    'gallery', 
    'passes', 
    'hotels', 
    'testimonials', 
    'media', 
    'users', 
    'system', 
    'backup'
  ],
  'Admin': [
    'analytics', 
    'submissions', 
    'orders', 
    'emails',
    'branding', 
    'page-images', 
    'events', 
    'gallery', 
    'passes', 
    'hotels', 
    'testimonials', 
    'media', 
    'users', 
    'system', 
    'backup'
  ],
  'Executive Lead': [
    'analytics', 
    'submissions', 
    'orders', 
    'emails',
    'passes', 
    'hotels', 
    'testimonials', 
    'media'
  ],
  'Event Coordinator': [
    'events', 
    'gallery', 
    'analytics', 
    'media', 
    'hotels'
  ],
  'Ticketing & Passes': [
    'passes', 
    'orders', 
    'emails',
    'submissions', 
    'analytics'
  ],
  'Concierge Lead': [
    'submissions', 
    'orders', 
    'emails',
    'hotels', 
    'testimonials'
  ],
  'Curator': [
    'gallery', 
    'page-images', 
    'media', 
    'testimonials', 
    'branding'
  ],
  'Logistics Lead': [
    'hotels', 
    'events', 
    'submissions', 
    'analytics'
  ]
};

export const hasRoleAccess = (role: AdminRole | undefined, tab: AdminTabId): boolean => {
  if (!role) return false;
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;
  return allowed.includes(tab);
};

export const getAllowedTabsForRole = (role: AdminRole | undefined): AdminTabId[] => {
  if (!role) return ['analytics'];
  return ROLE_PERMISSIONS[role] || ['analytics'];
};

export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'user-owner-0',
    username: 'owner',
    password: 'ownerpassword',
    passcode: '2027',
    name: 'Executive Owner',
    role: 'Owner',
    email: 'owner@grenadacaricom2027.com',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    lastLogin: new Date().toISOString(),
    notes: 'Supreme Application Owner with unrestricted master access & credential autonomy'
  },
  {
    id: 'user-admin-1',
    username: 'admin',
    password: 'admin',
    name: 'Director General',
    role: 'Admin',
    email: 'director@grenadacaricom2027.com',
    status: 'active',
    createdAt: '2026-01-15T09:00:00.000Z',
    lastLogin: new Date().toISOString(),
    notes: 'Primary Master Administrator for Festival Console & Infrastructure'
  },
  {
    id: 'user-coordinator-2',
    username: 'coordinator',
    password: 'events2027',
    name: 'Event Coordinator',
    role: 'Event Coordinator',
    email: 'events@grenadacaricom2027.com',
    status: 'active',
    createdAt: '2026-02-01T10:30:00.000Z',
    notes: 'Manages festival itinerary, DJs, locations and schedule'
  },
  {
    id: 'user-concierge-3',
    username: 'concierge',
    password: 'vip2027',
    name: 'VIP Concierge Lead',
    role: 'Concierge Lead',
    email: 'concierge@grenadacaricom2027.com',
    status: 'active',
    createdAt: '2026-02-10T14:15:00.000Z',
    notes: 'Oversees VIP guest communications, flight registrations and wristband inquiries'
  }
];

export const getAdminUsers = (): AdminUser[] => {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_USERS));
      return DEFAULT_ADMIN_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let updatedList = [...parsed];
      let hasMigration = false;

      // Migrate legacy 'Super Admin' to 'Admin' if present
      updatedList = updatedList.map((u: any) => {
        if (u.role === 'Super Admin') {
          hasMigration = true;
          return { ...u, role: 'Admin' };
        }
        return u;
      });

      // Ensure Owner user exists in list
      const hasOwner = updatedList.some((u: any) => u.role === 'Owner' || u.username.toLowerCase() === 'owner');
      if (!hasOwner) {
        updatedList.unshift(DEFAULT_ADMIN_USERS[0]);
        hasMigration = true;
      }

      if (hasMigration) {
        localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(updatedList));
      }
      return updatedList;
    }
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_USERS));
    return DEFAULT_ADMIN_USERS;
  } catch (err) {
    console.error('Failed to load admin users from storage:', err);
    return DEFAULT_ADMIN_USERS;
  }
};

export const saveAdminUsers = (users: AdminUser[]): void => {
  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save admin users to storage:', err);
  }
};

export const createAdminUser = (
  userData: Omit<AdminUser, 'id' | 'createdAt'>
): { success: boolean; error?: string; user?: AdminUser } => {
  const users = getAdminUsers();
  
  const cleanUsername = userData.username.trim().toLowerCase();
  if (!cleanUsername) {
    return { success: false, error: 'Username is required.' };
  }
  
  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: `Username "${cleanUsername}" is already in use. Please choose another.` };
  }

  if (!userData.password || userData.password.length < 3) {
    return { success: false, error: 'Password must be at least 3 characters.' };
  }

  if (!userData.name.trim()) {
    return { success: false, error: 'Full name or display name is required.' };
  }

  if (userData.role === 'Owner') {
    return { success: false, error: 'Cannot create an Owner role from Console Users. The Owner account is managed exclusively in Owner Control.' };
  }

  const newUser: AdminUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    username: cleanUsername,
    password: userData.password,
    passcode: userData.passcode?.trim() || undefined,
    name: userData.name.trim(),
    role: userData.role || 'Executive Lead',
    email: userData.email?.trim() || undefined,
    status: userData.status || 'active',
    createdAt: new Date().toISOString(),
    notes: userData.notes?.trim() || undefined
  };

  const updatedUsers = [newUser, ...users];
  saveAdminUsers(updatedUsers);

  return { success: true, user: newUser };
};

export const updateAdminUser = (
  id: string,
  updates: Partial<Omit<AdminUser, 'id' | 'createdAt'>>
): { success: boolean; error?: string; user?: AdminUser } => {
  const users = getAdminUsers();
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return { success: false, error: 'User not found.' };
  }

  const existing = users[index];

  // If changing username, check uniqueness
  if (updates.username) {
    const cleanUsername = updates.username.trim().toLowerCase();
    if (cleanUsername !== existing.username.toLowerCase() && users.some(u => u.id !== id && u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: `Username "${cleanUsername}" is already taken by another user.` };
    }
  }

  // Password validation if provided
  if (updates.password !== undefined && updates.password.length < 3) {
    return { success: false, error: 'Password must be at least 3 characters.' };
  }

  const updatedUser: AdminUser = {
    ...existing,
    ...updates,
    username: updates.username ? updates.username.trim().toLowerCase() : existing.username,
    name: updates.name ? updates.name.trim() : existing.name,
    password: updates.password !== undefined && updates.password !== '' ? updates.password : existing.password,
    passcode: updates.passcode !== undefined ? updates.passcode.trim() : existing.passcode,
    email: updates.email !== undefined ? updates.email.trim() : existing.email,
    notes: updates.notes !== undefined ? updates.notes.trim() : existing.notes
  };

  users[index] = updatedUser;
  saveAdminUsers(users);

  // If currently authenticated as this user, update cached current user
  const current = getCurrentAdminUser();
  if (current && current.id === id) {
    setCurrentAdminUser(updatedUser);
  }

  return { success: true, user: updatedUser };
};

export const deleteAdminUser = (
  id: string
): { success: boolean; error?: string } => {
  const users = getAdminUsers();
  const userToDelete = users.find(u => u.id === id);

  if (!userToDelete) {
    return { success: false, error: 'User not found.' };
  }

  // Safety check: ensure at least one active user exists
  const remainingActiveUsers = users.filter(u => u.id !== id && u.status === 'active');
  if (remainingActiveUsers.length === 0) {
    return { success: false, error: 'Cannot delete the only active console user. Create another active user first.' };
  }

  const filtered = users.filter(u => u.id !== id);
  saveAdminUsers(filtered);

  return { success: true };
};

export const authenticateAdminUser = (
  usernameInput: string,
  passwordInput: string
): { success: boolean; user?: AdminUser; error?: string } => {
  const users = getAdminUsers();
  const cleanUsername = usernameInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: 'Please enter both username and password.' };
  }

  const foundUser = users.find(
    u => u.username.toLowerCase() === cleanUsername && u.password === cleanPassword
  );

  if (!foundUser) {
    return { success: false, error: 'Invalid username or password. Please verify credentials.' };
  }

  if (foundUser.status === 'suspended') {
    return { success: false, error: 'This user account is suspended. Please contact the administrator.' };
  }

  // Update last login
  const updatedUser: AdminUser = {
    ...foundUser,
    lastLogin: new Date().toISOString()
  };

  updateAdminUser(foundUser.id, { lastLogin: updatedUser.lastLogin });
  setCurrentAdminUser(updatedUser);

  return { success: true, user: updatedUser };
};

export const getCurrentAdminUser = (): AdminUser | null => {
  try {
    const raw = sessionStorage.getItem(CURRENT_AUTH_USER_KEY) || localStorage.getItem(CURRENT_AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.role as string) === 'Super Admin') {
      parsed.role = 'Admin';
      setCurrentAdminUser(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Failed to get current admin user:', err);
    return null;
  }
};

export const setCurrentAdminUser = (user: AdminUser | null): void => {
  try {
    if (user) {
      sessionStorage.setItem(CURRENT_AUTH_USER_KEY, JSON.stringify(user));
      localStorage.setItem(CURRENT_AUTH_USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(CURRENT_AUTH_USER_KEY);
      localStorage.removeItem(CURRENT_AUTH_USER_KEY);
    }
  } catch (err) {
    console.error('Failed to set current admin user:', err);
  }
};

export const logoutAdminUser = (): void => {
  setCurrentAdminUser(null);
  sessionStorage.removeItem('admin_authenticated');
  localStorage.removeItem('admin_authenticated');
};

export const resetAdminUsersToDefault = (): AdminUser[] => {
  saveAdminUsers(DEFAULT_ADMIN_USERS);
  return DEFAULT_ADMIN_USERS;
};
