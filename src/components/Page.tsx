import { useNavigate } from 'react-router-dom';
import { hideBackButton, onBackButtonClick, showBackButton, postEvent } from '@telegram-apps/sdk-react';
import { type PropsWithChildren, useEffect, useRef, useState, useCallback } from 'react';
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
        // Проверяем разные способы определения Telegram
        let isTelegram = false;
        
        // Способ 1: Проверяем WebApp API
        if ((window as any).Telegram?.WebApp) {
          isTelegram = true;
        }
        
        // Способ 2: Проверяем наличие объекта Telegram и инициализируем WebApp
        else if ((window as any).Telegram) {
          try {
            // Инициализируем WebApp если он не инициализирован
            if (!(window as any).Telegram.WebApp) {
              (window as any).Telegram.WebApp = (window as any).Telegram.WebApp || {};
            }
            isTelegram = true;
          } catch (error) {
            console.log('❌ Ошибка инициализации WebApp:', error);
          }
        }
        
        // Способ 3: Проверяем User Agent
        else if (navigator.userAgent.includes('Telegram')) {
          isTelegram = true;
        }
        
        // Способ 4: Проверяем URL параметры
        else if (window.location.search.includes('tgWebAppData') || 
                 window.location.hash.includes('tgWebAppData')) {
          isTelegram = true;
        }
        
        // Если мы в Telegram, инициализируем WebApp
        if (isTelegram && (window as any).Telegram?.WebApp) {
          try {
            const tg = (window as any).Telegram.WebApp;
            
            // Вызываем ready() для полной инициализации
            if (typeof tg.ready === 'function') {
              tg.ready();
            }
          } catch (error) {
            console.error('❌ Ошибка инициализации WebApp:', error);
          }
        }
        
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

  // Обработчик кнопки "Назад" - используем useCallback для стабильной ссылки
  const handleBackClick = useCallback(() => {
    if (onBackClick) {
      onBackClick();
    } else {
      goBack();
    }
  }, [onBackClick, goBack]);

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
  }, [isInTelegram, back, handleBackClick]);

  // Настройка кнопки назад в Telegram
  useEffect(() => {
    if (!isInTelegram) {
      return;
    }

    let cleanup: (() => void) | undefined;

    if (back) {
      try {
        // Пробуем использовать нативный Telegram WebApp API
        const tg = (window as any).Telegram?.WebApp;
        if (tg && tg.BackButton) {
          // Показываем кнопку назад
          tg.BackButton.show();
          
          // Подключаем обработчик
          const backHandler = () => {
            handleBackClick();
          };
          
          tg.BackButton.onClick(backHandler);
          
          cleanup = () => {
            tg.BackButton.offClick(backHandler);
            tg.BackButton.hide();
          };
        } else {
          // Fallback к SDK функциям
          showBackButton();
          cleanup = onBackButtonClick(handleBackClick);
        }
      } catch (error) {
        console.error('❌ Ошибка при настройке кнопки назад в Telegram:', error);
      }
    } else {
      try {
        // Скрываем кнопку назад
        const tg = (window as any).Telegram?.WebApp;
        if (tg && tg.BackButton) {
          tg.BackButton.hide();
        } else {
          hideBackButton();
        }
      } catch (error) {
        console.error('❌ Ошибка при скрытии кнопки назад в Telegram:', error);
      }
    }

    // Cleanup функция
    return () => {
      if (cleanup) {
        try {
          cleanup();
        } catch (error) {
          console.error('❌ Ошибка при очистке обработчика кнопки назад:', error);
        }
      }
    };
  }, [back, isInTelegram, handleBackClick]);

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