import { useMemo, FC, useEffect, useState } from 'react';
import {
  initDataState as _initDataState,
  useSignal,
} from '@telegram-apps/sdk-react';
import { useNavigate } from 'react-router-dom';

// Пользовательские компоненты и хуки
import { Page } from '@/components/Page';
import Stats from '@/components/Stats';
import { useSupabaseUser } from '@/lib/supabase/hooks/useSupabaseUser';
import { logger } from '@/lib/logger';

// Стили
import './MainScreen.css';

// Компонент ошибки
const ErrorState: FC<{ message: string }> = ({ message }) => (
  <div className="error-container">
    <div className="error-icon" aria-hidden="true">⚠️</div>
    <h2 className="error-title">Ошибка</h2>
    <p className="error-message">{message}</p>
  </div>
);

// Компонент предупреждения для браузера
const BrowserWarning: FC = () => (
  <div className="browser-warning">
    <div className="browser-warning-icon" aria-hidden="true">📱</div>
    <h2 className="browser-warning-title">Только для Telegram</h2>
    <p className="browser-warning-message">
      Это приложение предназначено для использования в Telegram Mini Apps.
      Пожалуйста, откройте его через Telegram.
    </p>
  </div>
);

export const MainScreen: FC = () => {
  const navigate = useNavigate();
  const [, setContentVisible] = useState(false);

  // Проверяем, работает ли приложение в Telegram Mini App
  const isInTelegramApp = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).Telegram?.WebApp;
  }, []);

  // Проверяем, можно ли показывать содержимое в браузере
  const allowBrowserAccess = useMemo(() => {
    return import.meta.env.VITE_ALLOW_BROWSER_ACCESS === 'true';
  }, []);

  // Определяем, показывать ли содержимое приложения
  const showAppContent = useMemo(() => {
    return isInTelegramApp || allowBrowserAccess;
  }, [isInTelegramApp, allowBrowserAccess]);

  // Получаем initData из Telegram SDK
  const initDataState = useSignal(_initDataState);
  
  // Используем наш хук для работы с Supabase
  const { loading, error } = useSupabaseUser(initDataState);

  // Пользователь из initData
  const user = useMemo(() => 
    initDataState && initDataState.user ? initDataState.user : undefined,
  [initDataState]);

  // Анимация появления контента
  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        setContentVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  // Обработчик перехода к выбору практики
  const handleSelectPractice = () => {
    navigate('/quiz');
  };

  // Обработчик перехода в профиль
  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Если это не Telegram App и не разрешен доступ в браузере, показываем предупреждение
  if (!showAppContent) {
    logger.warn('Access denied: not in Telegram app and browser access not allowed');
    return (
      <Page back={false}>
        <div className="main-screen">
          <BrowserWarning />
        </div>
      </Page>
    );
  }

  // Если есть ошибка при получении данных
  if (error) {
    return (
      <Page back={false}>
        <div className="main-screen">
          <ErrorState message={error.message} />
        </div>
      </Page>
    );
  }

  // Если нет данных пользователя
  if (!user) {
    return (
      <Page back={false}>
        <div className="main-screen">
          <ErrorState message="Не удалось получить данные пользователя из Telegram" />
        </div>
      </Page>
    );
  }

  return (
    <Page back={false}>
      <div className={`overflow-x-hidden`}>
        {/* Top Bar с аватаром и настройками */}
        <div className="!py-2 !px-4 flex justify-between items-center border-b border-black">
          <div onClick={handleProfileClick}>
            {user.photo_url ? (
                <img className={'w-6 h-6 rounded-full border border-black'} src={user.photo_url}
                     alt={user.username || user.first_name} loading="lazy"/>
            ) : (
                <div className="w-6 h-6 rounded-full !bg-gray-200 flex items-center justify-center" aria-hidden="true">
                  {user.first_name.charAt(0)}
                </div>
            )}
          </div>

          <img src={'/logo.svg'} alt={''}/>
          <img src={'/settings.svg'} alt={''}/>


        </div>

        {/* Блок статистики и кнопка выбора практики */}
        <Stats
          strength={3}
          practiceMinutes={100}
          daysInFlow={2}
          onSelectPractice={handleSelectPractice}
        />
      </div>
    </Page>
  );
}; 