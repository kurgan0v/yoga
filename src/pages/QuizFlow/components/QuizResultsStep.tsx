import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../../contexts/QuizContext';
import { supabase } from '../../../lib/supabase/client';
import { Button } from '../../../ui/components/Button/Button';
import VideoPlayer from "@/components/Player/VideoPlayer.tsx";

// Структура контента из Supabase
interface ContentData {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  content_type: { 
    name: string; 
    slug: string; 
  } | null;
}

interface QuizLogicItem {
  id: string;
  priority: number | null;
  content_id: string;
  contents: ContentData;
}

const QuizResultsStep: React.FC = () => {
  const { state } = useQuiz();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<ContentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const findRecommendation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Для самостоятельных медитаций не ищем рекомендации - используем таймер
        if (state.practiceType === 'meditation' && state.approach === 'self') {
          setLoading(false);
          return;
        }
        
        if (!supabase || !state.practiceType) {
          throw new Error('Отсутствуют необходимые параметры для поиска рекомендации');
        }

        // Строим запрос на основе выбранных параметров
        let query = supabase
          .from('quiz_logic')
          .select(`
            id,
            priority,
            content_id,
            contents:content_id (
              id,
              title,
              description,
              thumbnail_url,
              duration,
              content_type:content_types (
                name,
                slug
              )
            )
          `)
          .eq('practice_type', state.practiceType)
          .order('priority', { ascending: false });

        // Добавляем фильтры в зависимости от выбранных параметров
        if (state.duration) {
          query = query
            .gte('duration_max', state.duration.min)
            .lte('duration_min', state.duration.max);
        }

        if (state.goal) {
          query = query.eq('goal', state.goal);
        }

        if (state.approach) {
          query = query.eq('approach', state.approach);
        }

        // Получаем результаты
        const { data, error } = await query.limit(10);

        if (error) throw error;

        if (!data || data.length === 0) {
          // Если конкретные результаты не найдены, ищем менее специфичные
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('quiz_logic')
            .select(`
              id,
              priority,
              content_id,
              contents:content_id (
                id,
                title,
                description,
                thumbnail_url,
                duration,
                content_type:content_types (
                  name,
                  slug
                )
              )
            `)
            .eq('practice_type', state.practiceType)
            .order('priority', { ascending: false })
            .limit(5);
            
          if (fallbackError) throw fallbackError;
          
          if (!fallbackData || fallbackData.length === 0) {
            throw new Error('Не найдены подходящие практики для ваших параметров');
          }
          
          // Выбираем случайный элемент из подходящих
          const randomIndex = Math.floor(Math.random() * fallbackData.length);
          const selectedItem = fallbackData[randomIndex] as any;
          setRecommendation(selectedItem.contents);
        } else {
          // Выбираем случайный элемент из топ-приоритетных результатов
          const byPriority: Record<number, QuizLogicItem[]> = {};
          
          data.forEach((item: any) => {
            const priority = item.priority || 0;
            if (!byPriority[priority]) {
              byPriority[priority] = [];
            }
            byPriority[priority].push(item);
          });
          
          // Берем группу с самым высоким приоритетом
          const highestPriority = Math.max(...Object.keys(byPriority).map(Number));
          const topPriorityItems = byPriority[highestPriority];
          
          // Выбираем случайный элемент из топ-приоритетных
          const randomIndex = Math.floor(Math.random() * topPriorityItems.length);
          const selectedItem = topPriorityItems[randomIndex] as any;
          setRecommendation(selectedItem.contents);
        }
      } catch (error: any) {
        console.error('Ошибка при поиске рекомендации:', error);
        setError(error.message || 'Ошибка при поиске рекомендации');
      } finally {
        setLoading(false);
      }
    };

    findRecommendation();
  }, [state.practiceType, state.duration, state.goal, state.approach]);

  const handleStartPractice = () => {
    // Для самостоятельных медитаций переходим напрямую на таймер без поиска рекомендаций
    if (state.practiceType === 'meditation' && state.approach === 'self' && state.selfMeditationSettings) {
      const { object, duration } = state.selfMeditationSettings;
      navigate(`/practice/timer`, {
        state: { 
          duration, 
          object, 
          fromQuiz: true,
          practiceType: 'meditation'
        } 
      });
      return;
    }
    
    // Для всех остальных практик (видео, аудио) переходим по ID контента
    if (recommendation) {
      navigate(`/practice/${recommendation.id}`);
    }
  };

  const handleRetakeQuiz = () => {
    navigate('/quiz');
  };

  const handleOtherPractice = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="quiz-loading">
        <div className="quiz-loading-spinner"></div>
        <p>Подбираем идеальную практику для вас...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-error">
        <h3>Произошла ошибка</h3>
        <p>{error}</p>
        <Button onClick={handleRetakeQuiz} fullWidth>
          Начать заново
        </Button>
      </div>
    );
  }

  // Специальный рендеринг для самостоятельных медитаций
  if (state.practiceType === 'meditation' && state.approach === 'self' && state.selfMeditationSettings) {
    return (
      <div className="quiz-step-content">
        <div className="quiz-recommendation">
          <div className="recommendation-image">
            <img src="/assets/images/meditation-placeholder.jpg" alt="Самостоятельная медитация" />
          </div>
          
          <div className="recommendation-details">
            <h3 className="recommendation-title">телесная практика</h3>
            <div className="recommendation-meta">
              <span className="recommendation-type">2 силы</span>
              <span className="recommendation-duration">до 7 минут</span>
              <span className="recommendation-category">йога</span>
            </div>
            <p className="recommendation-description">
              Идеально подходит, чтобы начать заниматься регулярно или вернуться в ритм. Когда тебя давно не было, тебе открыты только 7ми минутные практики, чтобы мягко включиться в процесс. Если есть желание сделать более длительную и плотную практику: выполняй 7ми минутку, и тебе откроется доступ к другим.
            </p>
            <p className="recommendation-description">
              Разнообразный и богатый опыт говорит нам, что реализация намеченных плановых заданий прекрасно подходит для реализации инновационных методов управления процессами.
            </p>
          </div>
          
          <div className="recommendation-actions">
            {/*<Button onClick={handleStartPractice} fullWidth>
              выбрать практику
            </Button>*/}
            <Button className={'!rounded-none'} onClick={handleOtherPractice} >
              другая практика
            </Button>
            <p  className={'!rounded-none font-bold underline underline-offset-4 text-center'} onClick={handleRetakeQuiz} variant="inverted">
              о направлении
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-step-content">
      {recommendation && (
        <div className="quiz-recommendation">
          {recommendation.thumbnail_url && (
              <VideoPlayer />

          )}
          
          <div className="recommendation-details">
            <div className={'flex items-center gap-2 justify-between'}>
              <h3 className="recommendation-title">{recommendation.title}</h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M6 7.2002V16.6854C6 18.0464 6 18.7268 6.20412 19.1433C6.58245 19.9151 7.41157 20.3588 8.26367 20.2454C8.7234 20.1842 9.28964 19.8067 10.4221 19.0518L10.4248 19.0499C10.8737 18.7507 11.0981 18.6011 11.333 18.5181C11.7642 18.3656 12.2348 18.3656 12.666 18.5181C12.9013 18.6012 13.1266 18.7515 13.5773 19.0519C14.7098 19.8069 15.2767 20.1841 15.7364 20.2452C16.5885 20.3586 17.4176 19.9151 17.7959 19.1433C18 18.7269 18 18.0462 18 16.6854V7.19691C18 6.07899 18 5.5192 17.7822 5.0918C17.5905 4.71547 17.2837 4.40973 16.9074 4.21799C16.4796 4 15.9203 4 14.8002 4H9.2002C8.08009 4 7.51962 4 7.0918 4.21799C6.71547 4.40973 6.40973 4.71547 6.21799 5.0918C6 5.51962 6 6.08009 6 7.2002Z"
                    stroke="#191919" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>

            </div>
            <div className="recommendation-meta">
              <span  className="recommendation-type">
                {recommendation.content_type?.name || 'Практика'}
              </span>
              {recommendation.duration && (
                  <span className="recommendation-duration">
                  {Math.floor(recommendation.duration / 60)} мин
                </span>
              )}
            </div>
            {recommendation.description && (
                <p className="recommendation-description">{recommendation.description}</p>
            )}
          </div>

          <div className="recommendation-actions">
            {/*<Button onClick={handleStartPractice} fullWidth>
              выбрать практику
            </Button>*/}
            <Button className={'!rounded-none'} onClick={handleOtherPractice} fullWidth>
              другая практика
            </Button>
            <p  className={'!rounded-none font-bold underline underline-offset-4 text-center'} onClick={handleRetakeQuiz} variant="inverted" fullWidth>
              о направлении
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResultsStep; 