import React, {useState, useEffect, useMemo} from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page';
import { useContents, ContentItem } from '@/lib/supabase/hooks/useContents';
import { useFavorites } from '@/lib/supabase/hooks';
import { useSupabaseUser } from '@/lib/supabase/hooks';
import './LibraryPage.css';
import {
  initDataState as _initDataState,
  useSignal,
} from '@telegram-apps/sdk-react';
import {Link} from "@/components";
// Основные категории для главной страницы библиотеки
const mainCategories = [
  { id: 'physical', name: 'Тело', img: '/cat1.png', icon: '🧘‍♀️', description: 'Асаны и физические практики' },
  { id: 'meditation', name: 'Медитация', img: '/cat2.png', icon: '🧠', description: 'Практики осознанности' },
  { id: 'base', name: 'База', icon: '⭐', img: '/cat3.png', description: 'Основы и базовые навыки' },
  { id: 'breathing', name: 'Дыхание', img: '/cat1.png', icon: '🌬️', description: 'Дыхательные техники' }
];

// Все категории включая фильтры
const allCategories = [
  { id: 'all', name: 'Все' },
  ...mainCategories
];

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = главная страница
  const [timeFilter, setTimeFilter] = useState<string | null>(null);
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Получаем пользователя
  const { supabaseUser } = useSupabaseUser(undefined);
  const userId = supabaseUser?.id || null;

  // Получаем избранное
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites(userId);

  // Получаем контент только если выбрана конкретная категория
  const { contents, loading, error } = useContents(selectedCategory !== null ? {
    categorySlug: selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined,
    duration: timeFilter ? getDurationRange(timeFilter) : undefined
  } : {});

  // Получаем последние практики для слайдера "Новое" (только для главной страницы)
  const shouldLoadLatest = selectedCategory === null;
  const { contents: latestContents, loading: latestLoading } = useContents(shouldLoadLatest ? {} : { search: 'NEVER_MATCH_ANYTHING_XYZ' }); // Hack: используем поиск который ничего не найдет для отключения загрузки

  // Применяем анимацию появления контента
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Автопроигрывание слайдера (только для главной страницы)
  useEffect(() => {
    if (selectedCategory === null && latestContents.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % Math.min(latestContents.length, 3));
      }, 5000); // Смена слайда каждые 5 секунд
      
      return () => clearInterval(interval);
    }
  }, [selectedCategory, latestContents.length]);

  // Функция для получения диапазона длительности исходя из фильтра
  function getDurationRange(timeFilter: string): { min: number, max: number } | undefined {
    switch (timeFilter) {
      case 'under7': return { min: 0, max: 7 * 60 };
      case '7-20': return { min: 7 * 60, max: 20 * 60 };
      case '20-40': return { min: 20 * 60, max: 40 * 60 };
      case '40-60': return { min: 40 * 60, max: 60 * 60 };
      default: return undefined;
    }
  }

  // Функция для получения текстовой метки фильтра времени
  function getTimeFilterLabel(timeFilter: string): string {
    switch (timeFilter) {
      case 'under7': return 'до 7 мин';
      case '7-20': return '7-20 мин';
      case '20-40': return '20-40 мин';
      case '40-60': return '40-60 мин';
      default: return 'Время';
    }
  }

  // Обработчик выбора основной категории (переход к списку практик)
  const handleMainCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Обработчик выбора подкатегории в фильтрах
  const handleSubCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Возврат к главной странице библиотеки
  const handleBackToMain = () => {
    setSelectedCategory(null);
    setTimeFilter(null);
    setShowTimeFilter(false);
  };

  // Обработчик перехода к конкретной практике
  const handlePracticeSelect = (practice: ContentItem) => {
    navigate(`/practice/${practice.id}`);
  };

  // Обработчик добавления/удаления из избранного
  const handleToggleFavorite = (e: React.MouseEvent, practiceId: string) => {
    e.stopPropagation();
    if (!userId) return;
    
    if (isFavorite(practiceId)) {
      removeFromFavorites(practiceId);
    } else {
      addToFavorites(practiceId);
    }
  };

  // Обработчик перехода к избранному
  // const handleFavoritesClick = () => {
  //   navigate('/library/favorites');
  // };

  // Обработчик переключения фильтра по времени
  const toggleTimeFilter = () => {
    setShowTimeFilter(!showTimeFilter);
  };

  // Обработчик выбора фильтра по времени
  const handleTimeFilterSelect = (filter: string) => {
    setTimeFilter(filter);
    setShowTimeFilter(false);
  };
  // Получаем initData из Telegram SDK
  const initDataState = useSignal(_initDataState);

  const user = useMemo(() =>
          initDataState && initDataState.user ? initDataState.user : undefined,
      [initDataState]);
  // Если категория не выбрана, показываем главную страницу
  if (selectedCategory === null) {
    return (
        <Page back={false}>
          {user && <div className="!py-2 !px-4 flex justify-between items-center border-b border-black">
            <Link to={'/'} >
              {user.photo_url ? (
                  <img className={'w-6 h-6 rounded-full border border-black'} src={user.photo_url}
                       alt={user.username || user.first_name} loading="lazy"/>
              ) : (
                  <div className="w-6 h-6 rounded-full !bg-gray-200 flex items-center justify-center"
                       aria-hidden="true">
                    {user.first_name.charAt(0)}
                  </div>
              )}
            </Link>

            <img src={'/logo.svg'} alt={''}/>
            <img src={'/settings.svg'} alt={''}/>


          </div>}
          <div>


            {/* Слайдер "Новое" */}
            <div>

              {latestLoading ? (
                  <div className="latest-loading">Загрузка...</div>
              ) : latestContents.length > 0 ? (
                  <div className="latest-slider-container">
                    <div className="flex flex-col h-[260px] bg-cover" style={{backgroundImage: `url(${latestContents[currentSlide]?.thumbnail_url || '/img/practice-default.jpg'})`}}
                         onClick={() => handlePracticeSelect(latestContents[currentSlide])}>
                      <div
                          className="latest-card-image"

                      >
                      </div>
                      <div className="latest-card-content">
                        <div className="flex items-center gap-2">
                          <p className={'py-1 !px-2 bg-[#414141] text-white'}>{Math.floor(latestContents[currentSlide]?.duration / 60)} мин</p>
                          <p className={'py-1 !px-2 bg-[#414141] text-white'}>{latestContents[currentSlide]?.categories?.name || 'Практика'}</p>
                        </div>
                        <h3 className="text-white font-bold text-2xl !mb-2">{latestContents[currentSlide]?.title}</h3>

                      </div>
                    </div>

                    {/* Пагинация точками */}
                    {latestContents.slice(0, 3).length > 1 && (
                        <div className="slider-dots absolute bottom-2 left-1/2 -translate-x-1/2">
                          {latestContents.slice(0, 3).map((_, index) => (
                              <button
                                  key={index}
                                  className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
                                  onClick={() => setCurrentSlide(index)}
                              />
                          ))}
                        </div>
                    )}
                  </div>
              ) : null}
            </div>

            {/* Главные категории */}
            <div>
              {mainCategories.map(category => (
                  <div className={'!p-4 border-b border-black'} key={category.id}>
                    <div className={'flex flex-col gap-4'} onClick={() => handleMainCategorySelect(category.id)}>

                      <div className={'flex items-center justify-between gap-2'}>
                        <h3 className="font-bold text-2xl">{category.name}</h3>
                        <p className={'text-[#D8D8D8] underline'}>все практики</p>
                      </div>
                      <p className="category-description">{category.description}</p>
                      <img src={category.img} className={''}/>
                    </div>
                  </div>
              ))}
            </div>

            {/* Кнопка избранного */}
            {/*<button className="favorites-main-button" onClick={handleFavoritesClick}>
              ❤️ Избранное
            </button>*/}
          </div>
        </Page>
    );
  }

  // Страница выбранной категории с практиками
  return (
      <Page back={true} onBackClick={handleBackToMain}>
        <div className={`library-container ${contentVisible ? 'content-visible' : ''}`}>
          <div className="library-header">
            <h1 className="library-title">
              {allCategories.find(cat => cat.id === selectedCategory)?.name || 'Категория'}
            </h1>
            <div className="time-filter-toggle" onClick={toggleTimeFilter}>
              {timeFilter ? getTimeFilterLabel(timeFilter) : 'Время'} {showTimeFilter ? '▲' : '▼'}
            </div>
          </div>

          {/* Фильтр по времени */}
          {showTimeFilter && (
              <div className="time-filter-dropdown">
            <button 
              onClick={() => handleTimeFilterSelect('under7')}
              className={timeFilter === 'under7' ? 'active' : ''}
            >
              до 7 минут
            </button>
            <button 
              onClick={() => handleTimeFilterSelect('7-20')}
              className={timeFilter === '7-20' ? 'active' : ''}
            >
              7-20 минут
            </button>
            <button 
              onClick={() => handleTimeFilterSelect('20-40')}
              className={timeFilter === '20-40' ? 'active' : ''}
            >
              20-40 минут
            </button>
            <button 
              onClick={() => handleTimeFilterSelect('40-60')}
              className={timeFilter === '40-60' ? 'active' : ''}
            >
              40-60 минут
            </button>
            {timeFilter && (
              <button onClick={() => setTimeFilter(null)}>Сбросить фильтр</button>
            )}
          </div>
        )}
        
        {/* Подкатегории */}
        <div className="category-tabs">
          {allCategories.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleSubCategorySelect(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        {/* Контент библиотеки */}
        <div className="library-content">
          {loading ? (
            <div className="library-loading">Загрузка...</div>
          ) : error ? (
            <div className="library-error">Ошибка: {error}</div>
          ) : contents.length === 0 ? (
            <div className="library-empty">
              {timeFilter 
                ? 'Нет практик с выбранным временем' 
                : 'В этой категории пока нет практик'}
            </div>
          ) : (
            <div className="practice-grid">
              {contents.map((item: ContentItem) => (
                <div 
                  key={item.id} 
                  className="practice-square-card"
                  onClick={() => handlePracticeSelect(item)}
                >
                  <div 
                    className="practice-square-thumbnail" 
                    style={{ backgroundImage: `url(${item.thumbnail_url || '/img/practice-default.jpg'})` }}
                  >
                    <button 
                      className={`square-favorite-button ${isFavorite(item.id) ? 'active' : ''}`}
                      onClick={(e) => handleToggleFavorite(e, item.id)}
                    >
                      {isFavorite(item.id) ? '❤️' : '🤍'}
                    </button>
                    <div className="practice-duration-badge">
                      {Math.floor(item.duration / 60)} мин
                    </div>
                  </div>
                  <div className="practice-square-info">
                    <h3 className="practice-square-title">{item.title}</h3>
                    <div className="practice-difficulty-stars">
                      {'⭐'.repeat(Number(item.difficulty) || 2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};

export default LibraryPage; 