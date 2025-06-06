# Документация по разделу "Библиотека"

## Логические основания
- **Вещь**: Раздел библиотеки для просмотра и выбора практик
- **Свойства**: Фильтрация, поиск, избранное, категории, мультимедиа (видео, аудио)
- **Отношения**: Пользователь ↔ Практики, Пользователь ↔ Избранное, Категории ↔ Практики

## Структура раздела

### Страницы
1. **LibraryPage** - главная страница библиотеки с списком практик и фильтрами
2. **FavoritesPage** - страница избранных практик с аналогичными фильтрами
3. **CategoryPage** - страница категории практик (Тело, Медитация, База, Дыхание)

### Основные компоненты
- TabBar - нижняя навигация приложения
- Фильтры категорий - переключение между категориями практик
- Фильтр времени - выбор диапазона длительности практик
- Карточки практик - отображение информации о практике

## Функциональность

### Фильтрация
- **По категориям**: Все, Тело, Медитация, База, Дыхание
- **По длительности**: 
  - до 7 минут
  - 7-20 минут
  - 20-40 минут
  - 40-60 минут

### Карточки практик
Каждая карточка практики отображает:
- Превью (thumbnail_url)
- Длительность в формате ММ:СС
- Тип медиа (Видео/Аудио)
- Уровень сложности ("N силы")
- Название практики
- Описание
- Кнопка добавления/удаления из избранного

### Избранное
- Добавление/удаление практик из избранного
- Отдельная страница с списком избранных практик
- Кнопка на главной странице для перехода к избранному

## Интеграция с Supabase

### Модель данных
- **contents** - таблица практик (видео, аудио, таймеры)
- **categories** - таблица категорий практик
- **content_types** - таблица типов контента (видео, аудио, таймер)
- **user_favorites** - таблица связей пользователь-избранная практика

### API хуки
- **useContents** - получение списка практик с фильтрацией
- **useFavorites** - работа с избранными практиками

## Пользовательский поток
1. Пользователь открывает библиотеку (по умолчанию показываются все практики)
2. Пользователь может:
   - Отфильтровать практики по категории
   - Отфильтровать практики по длительности
   - Добавить практику в избранное
   - Перейти к конкретной практике
   - Перейти на страницу избранного
3. На странице избранного пользователь видит только те практики, которые он добавил в избранное
4. Пользователь может удалить практику из избранного

## Технические особенности
- Подписка на Realtime обновления Supabase для мгновенного обновления данных
- Debounce для предотвращения лишних запросов при изменении фильтров
- Анимации для плавного появления контента
- Адаптивный дизайн для разных устройств

## Планы по улучшению
- Добавление функции поиска по названию и описанию практики
- Улучшение плавности анимаций и переходов
- Добавление возможности сортировки практик
- Интеграция с системой рекомендаций на основе истории просмотров 