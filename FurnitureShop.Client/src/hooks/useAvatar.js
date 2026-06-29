// src/hooks/useAvatar.js
import { useState, useEffect } from 'react';

export const getAvatarKey = (userId) => `user_avatar_${userId || 'admin'}`;

export const getAvatar = (userId) => {
  return localStorage.getItem(getAvatarKey(userId)) || localStorage.getItem('user_avatar_admin') || null;
};

export const setAvatar = (userId, avatarData) => {
  if (avatarData) {
    localStorage.setItem(getAvatarKey(userId), avatarData);
  } else {
    localStorage.removeItem(getAvatarKey(userId));
  }
  window.dispatchEvent(new Event('avatarChanged'));
};

export const useAvatar = (userId) => {
  const [avatar, setAvatarState] = useState(() => getAvatar(userId));

  useEffect(() => {
    const handleUpdate = () => {
      setAvatarState(getAvatar(userId));
    };
    window.addEventListener('avatarChanged', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('avatarChanged', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [userId]);

  return { avatar, setAvatar: (data) => setAvatar(userId, data) };
};
