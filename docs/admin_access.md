# Доступ к администраторской панели

## Обзор

В проекте реализован механизм ограничения доступа к администраторской панели через флаг `is_admin` в таблице `users` Supabase.

## Схема работы

1. **Проверка прав**: 
   - Пользователи с флагом `is_admin = true` могут получить доступ к админке через свой профиль
   - Доступ по URL `/#/admin` напрямую проверяет права пользователя через Supabase
   
2. **Резервный механизм**:
   - Реализован запасной вход по паролю (`admin123`)
   - Аутентификация по паролю хранится в localStorage для сохранения между сессиями

3. **Управление пользователями**:
   - Администраторы могут просматривать список всех пользователей
   - Администраторы могут назначать/снимать права администратора у других пользователей

## Технические компоненты

1. **База данных**:
   - Таблица `users` дополнена полем `is_admin` типа `boolean` с дефолтным значением `false`

2. **Интерфейс пользователя**:
   - В профиле пользователя на вкладке "Настройки" отображается кнопка для администраторов
   - Кнопка видна только если у пользователя есть права доступа

3. **Компоненты**:
   - `ProfileMain.tsx` - отображение кнопки администратора в профиле пользователя
   - `AdminPage.tsx` - страница администрирования с проверкой доступа
   - `UsersManager` - компонент управления пользователями с возможностью изменения прав

4. **Маршрутизация**:
   - Использует HashRouter, поэтому URL для доступа: `http://localhost:5180/#/admin` (обязательно с хешем)
   - Администратор также может перейти через кнопку в профиле

## Как получить права администратора

1. **Через Supabase**:
   ```sql
   UPDATE public.users 
   SET is_admin = true 
   WHERE id = 'идентификатор_пользователя';
   ```

2. **Через администраторскую панель**: 
   - Администратор может дать права другим пользователям через интерфейс
   - На странице управления пользователями у каждого пользователя есть кнопка "Сделать админом"

3. **Аварийный доступ**:
   - Прямой доступ к URL `/#/admin` с вводом пароля `admin123`

## Рекомендации по безопасности

1. Используйте сложные пароли в продакшн-версии
2. Включите RLS (Row Level Security) в Supabase для защиты таблицы users
3. Ограничьте доступ к панели администратора через особый TokenCredential
4. Реализуйте журналирование действий администраторов 