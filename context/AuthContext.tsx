import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import type { AppUser } from '@/types/mission';

type StoredUser = AppUser & {
  passwordHash: string;
};

type AuthContextValue = {
  currentUser: AppUser | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
};

const STORAGE_KEYS = {
  currentUserId: '@global-solution-cpad/auth/current-user-id',
  users: '@global-solution-cpad/auth/users',
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function publicUser(user: StoredUser): AppUser {
  return {
    createdAt: user.createdAt,
    email: user.email,
    id: user.id,
    name: user.name,
  };
}

function parseUsers(value: string | null): StoredUser[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function hashPassword(email: string, password: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${normalizeEmail(email)}:${password}`);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAuth() {
      const [[, usersValue], [, currentUserId]] = await AsyncStorage.multiGet([STORAGE_KEYS.users, STORAGE_KEYS.currentUserId]);
      const storedUsers = parseUsers(usersValue);
      const storedCurrent = storedUsers.find((user) => user.id === currentUserId);

      if (!mounted) {
        return;
      }

      setUsers(storedUsers);
      setCurrentUser(storedCurrent ? publicUser(storedCurrent) : null);
      setHydrated(true);
    }

    loadAuth().catch(() => {
      if (mounted) {
        setUsers([]);
        setCurrentUser(null);
        setHydrated(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function persist(nextUsers: StoredUser[], nextCurrentUser: AppUser | null) {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.users, JSON.stringify(nextUsers)],
      [STORAGE_KEYS.currentUserId, nextCurrentUser?.id ?? ''],
    ]);
  }

  async function register(name: string, email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);

    if (users.some((user) => user.email === normalizedEmail)) {
      throw new Error('Este email ja possui cadastro.');
    }

    const now = new Date().toISOString();
    const user: StoredUser = {
      createdAt: now,
      email: normalizedEmail,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      passwordHash: await hashPassword(normalizedEmail, password),
    };
    const nextUsers = [...users, user];
    const nextCurrentUser = publicUser(user);

    setUsers(nextUsers);
    setCurrentUser(nextCurrentUser);
    await persist(nextUsers, nextCurrentUser);
  }

  async function login(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);
    const user = users.find((storedUser) => storedUser.email === normalizedEmail);

    if (!user || user.passwordHash !== (await hashPassword(normalizedEmail, password))) {
      throw new Error('Email ou senha invalidos.');
    }

    const nextCurrentUser = publicUser(user);
    setCurrentUser(nextCurrentUser);
    await AsyncStorage.setItem(STORAGE_KEYS.currentUserId, nextCurrentUser.id);
  }

  async function logout() {
    setCurrentUser(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.currentUserId);
  }

  return (
    <AuthContext.Provider value={{ currentUser, hydrated, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
