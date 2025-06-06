import { useNavigate } from 'react-router-dom';
import { hideBackButton, onBackButtonClick, showBackButton, postEvent } from '@telegram-apps/sdk-react';
import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { SafeAreaFade } from '@/components/SafeAreaFade/SafeAreaFade';
import TabBar from '@/components/TabBar/TabBar';
import { useNavigationHistory } from '@/lib/hooks/useNavigationHistory';
import './Page.css';

// Стили для учета отступов safe area с дополнительным отступом для fullscreen режима
const safeAreaStyle = {
  paddingTop: 'calc(var(--safe-area-top, 0px) + var(--fullscreen-extra-padding, 0px))',
  paddingRight: 'var(--safe-area-right, 0px)',
  paddingBottom: 'var(--safe-area-bottom, 0px)',
  paddingLeft: 'var(--safe-area-left, 0px)',
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  width: '100%',
  boxSizing: 'border-box' as const,
  position: 'relative' as const
};

interface PageProps {
  /**
   * True if it is allowed to go back from this page.
   */
  back?: boolean;
  /**
   * True if the page should display the bottom TabBar.
   */
  showTabBar?: boolean;
  /**
   * True if the page should display the SafeAreaFade at the top.
   */
  showSafeAreaFade?: boolean;
  /**
   * Custom back button handler. If not provided, uses navigate(-1).
   */
  onBackClick?: () => void;
}

export function Page({ 
  children, 
  back = true, 
  showTabBar = true,
  showSafeAreaFade = true,
  onBackClick,
}: PropsWithChildren<PageProps>) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const { goBack, canNavigateBack } = useNavigationHistory();

  // Проверяем, работает ли приложение в Telegram
  useEffect(() => {
    const checkTelegramEnvironment = () => {
      try {
        const isTelegram = !!(window as any).Telegram?.WebApp;
        setIsInTelegram(isTelegram);
        return isTelegram;
      } catch (error) {
        console.log('Не удалось определить окружение Telegram:', error);
        setIsInTelegram(false);
        return false;
      }
    };

    checkTelegramEnvironment();
  }, []);

  // Обработчик кнопки "Назад"
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      goBack();
    }
  };

  // Обработчик клавиши Escape для браузера
  useEffect(() => {
    if (!isInTelegram && back) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          handleBackClick();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isInTelegram, back, onBackClick]);

  useEffect(() => {
    if (back) {
      if (isInTelegram) {
        // В Telegram используем SDK
        try {
          showBackButton();
          return onBackButtonClick(handleBackClick);
        } catch (error) {
          console.log('Ошибка при настройке кнопки назад в Telegram:', error);
        }
      }
      // В браузере кнопка "Назад" будет отображаться в UI
    } else {
      if (isInTelegram) {
        try {
          hideBackButton();
        } catch (error) {
          console.log('Ошибка при скрытии кнопки назад в Telegram:', error);
        }
      }
    }
  }, [back, isInTelegram, onBackClick]);

  // Повторно запрашиваем safe area при монтировании страницы
  useEffect(() => {
    if (isInTelegram) {
      try {
        postEvent('web_app_request_safe_area');
        postEvent('web_app_request_viewport');
      } catch (error) {
        console.log('Ошибка при запросе safe area:', error);
      }
    }

    // Убедимся, что все родительские элементы имеют белый фон
    document.body.style.backgroundColor = '#ffffff';
    if (document.getElementById('root')) {
      document.getElementById('root')!.style.backgroundColor = '#ffffff';
    }
  }, [isInTelegram]);

  // Добавляем отступ снизу, если показываем TabBar
  const containerStyle = {
    ...safeAreaStyle,
    paddingBottom: showTabBar ? 'calc(70px + env(safe-area-inset-bottom, 0) + 8px)' : 'var(--safe-area-bottom, 0px)',
  };

  return (
    <div 
      className={`page-container ${showTabBar ? 'with-tab-bar' : ''} ${!isInTelegram ? 'browser-mode' : ''}`} 
      style={containerStyle}
      ref={containerRef}
    >
      {/* Кнопка "Назад" для браузера */}
      {!isInTelegram && back && canNavigateBack() && (
        <div className="browser-back-button-container">
          <button 
            className="browser-back-button" 
            onClick={handleBackClick}
            aria-label="Назад"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Назад</span>
          </button>
        </div>
      )}
      
      <div style={{ backgroundColor: '#ffffff' }}>
        {children}
      </div>
      {showTabBar && <TabBar />}
      {showSafeAreaFade && <SafeAreaFade />}
    </div>
  );
}