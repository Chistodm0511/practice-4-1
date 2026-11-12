import { Book } from "./task1-types";

// 1. Функция задержки
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 2. Имитация загрузки книг
export async function fetchBooks(): Promise<Book[]> {
  await delay(800); // Ждем 0.8 секунды

  // 20% шанс ошибки
  if (Math.random() < 0.2) {
    throw new Error('Сбой сети. Не удалось загрузить книги.');
  }

  const raw = localStorage.getItem('catalog');
  
  // ИСПРАВЛЕНО: если localStorage пуст, возвращаем начальные книги
  if (!raw) {
    return [
      { id: '1', title: 'TypeScript Guide', authors: ['John Doe'], year: 2024 },
      { id: '2', title: 'JavaScript Basics', authors: ['Jane Smith'], year: 2022 },
    ];
  }

  try {
    const parsed = JSON.parse(raw);
    // Если каталог сохранен как объект { id, books } (из Практики 3.1)
    if (parsed && parsed.books && Array.isArray(parsed.books)) {
      return parsed.books;
    }
    // Если это просто массив книг
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Ошибка парсинга localStorage', e);
    return [];
  }
}

// 3. Имитация сохранения книг
export async function saveBooks(books: Book[]): Promise<void> {
  await delay(500); // Ждем 0.5 секунды
  localStorage.setItem('catalog', JSON.stringify(books));
}