import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Memaksa browser kembali ke posisi paling atas (0,0)
    window.scrollTo(0, 0);
  }, [pathname]); // Akan berjalan setiap kali pathname (URL) berubah

  return null;
};
