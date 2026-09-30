import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const MenuContext = createContext(null);

function toMenuItem(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    emoji: row.emoji,
    category: 'Breakfast',
    available: row.available,
    isSpecial: row.is_special,
    sortOrder: row.sort_order,
    badge: row.is_special ? "TODAY'S SPECIAL" : undefined,
  };
}

export function MenuProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshMenu = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      const message = 'Menu service is not set up. Add your Supabase project URL and publishable key to .env.';
      setError(message);
      setLoading(false);
      return { error: message };
    }

    const { data, error: queryError } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (queryError) {
      setError(`Could not load today's menu: ${queryError.message}`);
      setLoading(false);
      return { error: queryError.message };
    }

    setItems(data.map(toMenuItem));
    setError('');
    setLoading(false);
    return { data };
  }, []);

  useEffect(() => {
    refreshMenu();
    if (!isSupabaseConfigured) return undefined;
    const timer = setInterval(refreshMenu, 30000);
    return () => clearInterval(timer);
  }, [refreshMenu]);

  const saveMenuItem = useCallback(async (item) => {
    if (!supabase) return { error: 'Menu service is not configured.' };

    const values = {
      name: item.name.trim(),
      description: item.description.trim(),
      price: Number(item.price),
      emoji: item.emoji.trim() || '🫓',
      available: item.available,
      is_special: item.isSpecial,
      sort_order: Number(item.sortOrder) || 0,
    };
    const request = item.id
      ? supabase.from('menu_items').update(values).eq('id', item.id)
      : supabase.from('menu_items').insert(values);
    const { error: saveError } = await request;

    if (saveError) {
      return { error: saveError.message };
    }
    return refreshMenu();
  }, [refreshMenu]);

  const deleteMenuItem = useCallback(async (id) => {
    if (!supabase) return { error: 'Menu service is not configured.' };
    const { error: deleteError } = await supabase.from('menu_items').delete().eq('id', id);
    if (deleteError) {
      return { error: deleteError.message };
    }
    return refreshMenu();
  }, [refreshMenu]);

  return (
    <MenuContext.Provider value={{ items, loading, error, refreshMenu, saveMenuItem, deleteMenuItem }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu must be used within a MenuProvider');
  return context;
}
