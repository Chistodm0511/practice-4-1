import './styles.css';
import { Book } from './task1-types';
import { applyFilters, filterByAuthor, filterByMinYear } from './task3-filters';
import { createBookFromForm } from "./task4-integration";
import { filterByTitle } from './task5-utils';
import { BookCatalog } from './task6-classes';
import { Wishlist } from './task7-wishlist';
import { fetchBooks, saveBooks } from './mock-api';

// ============================================================
// 1. СОСТОЯНИЕ ПРИЛОЖЕНИЯ (AsyncState)
// ============================================================
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success', data: T }
  | { status: 'error', message: string };

let state: AsyncState<Book[]> = { status: 'loading' };
let errorMessage = ''; // Отдельная переменная для ошибок сохранения

// Каталог и Вишлист (синхронные)
let catalog = new BookCatalog('main', []);
let wishlist = new Wishlist();

// Восстановление вишлиста из localStorage
const savedWishlist = localStorage.getItem('wishlist');
if (savedWishlist) {
  wishlist = new Wishlist(JSON.parse(savedWishlist));
}

function saveWishlist() {
  localStorage.setItem('wishlist', JSON.stringify(wishlist.getIds()));
}

// ============================================================
// 2. DOM-элементы
// ============================================================
const bookList = document.querySelector('#bookList') as HTMLDivElement;
const wishlistContainer = document.querySelector('#wishlistContainer') as HTMLDivElement;
const form = document.querySelector('#bookForm') as HTMLFormElement;
const filterBtn = document.querySelector('#applyFilters') as HTMLButtonElement;
const authorInput = document.querySelector('#filterAuthor') as HTMLInputElement;
const yearInput = document.querySelector('#filterYear') as HTMLInputElement;
const searchInput = document.querySelector('#searchInput') as HTMLInputElement;
const sortBySelect = document.querySelector('#sortBy') as HTMLSelectElement;
const errorContainer = document.querySelector('#errorMessage') as HTMLDivElement;

// ============================================================
// 3. СОЗДАНИЕ КАРТОЧКИ (без изменений)
// ============================================================
function createBookCard(book: Book): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'book-card';

  const titleEl = document.createElement('h3');
  titleEl.textContent = `${book.title} — ${book.authors.join(', ')}${book.year ? `, ${book.year}` : ''}`;
  card.append(titleEl);

  if (book.rating !== undefined) {
    const ratingEl = document.createElement('p');
    ratingEl.textContent = `Рейтинг: ${book.rating}`;
    card.append(ratingEl);
  }

  // Кнопка «Удалить» (асинхронная)
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Удалить';
  deleteBtn.addEventListener('click', async () => {
    if (state.status !== 'success') return;
    
    // Удаляем из каталога
    catalog.removeBook(book.id);
    const newBooks = catalog.getBooks();
    
    try {
      // Сохраняем асинхронно
      await saveBooks(newBooks);
      state = { status: 'success', data: newBooks };
      render();
    } catch (error) {
      // При ошибке сохранения не сбрасываем список
      errorMessage = error instanceof Error ? error.message : 'Ошибка сохранения';
      render();
      setTimeout(() => { errorMessage = ''; render(); }, 3000);
    }
  });
  card.append(deleteBtn);

  // Кнопка «Избранное» (синхронная)
  const favBtn = document.createElement('button');
  favBtn.textContent = wishlist.has(book.id) ? '❤️ В избранном' : '🤍 В избранное';
  favBtn.addEventListener('click', () => {
    wishlist.toggle(book.id);
    saveWishlist();
    render(); // Просто перерисовываем интерфейс
  });
  card.append(favBtn);

  return card;
}

// ============================================================
// 4. ОТРИСОВКА (render) на основе state.status
// ============================================================
function render() {
  // Очищаем контейнеры
  bookList.innerHTML = '';
  wishlistContainer.innerHTML = '';
  if (errorContainer) errorContainer.textContent = errorMessage;

  switch (state.status) {
    case 'idle':
      bookList.textContent = 'Нажмите кнопку для загрузки';
      break;

    case 'loading':
      bookList.textContent = 'Загрузка данных...';
      break;

    case 'error':
      const errorBlock = document.createElement('div');
      errorBlock.style.color = 'red';
      errorBlock.textContent = state.message;
      
      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'Повторить попытку';
      retryBtn.addEventListener('click', initApp);
      errorBlock.append(retryBtn);
      bookList.append(errorBlock);
      break;

    case 'success':
      // Обновляем каталог на основе данных из состояния
      catalog = new BookCatalog('main', state.data);
      
      // Применяем фильтры и сортировку
      const filters: ((book: Book) => boolean)[] = [];
      if (authorInput.value.trim()) filters.push(filterByAuthor(authorInput.value.trim()));
      if (yearInput.value) filters.push(filterByMinYear(parseInt(yearInput.value, 10)));
      if (searchInput.value.trim()) filters.push(filterByTitle(searchInput.value.trim()));

      const filtered = applyFilters(state.data, filters);
      
      // Сортируем (используем функцию sortBooks из task5-utils, а не метод класса, 
      // так как данные приходят извне)
      const sorted = [...filtered].sort((a, b) => {
        if (sortBySelect.value === 'year') return (b.year ?? 0) - (a.year ?? 0);
        return (b.rating ?? 0) - (a.rating ?? 0);
      });

      if (sorted.length === 0) {
        bookList.textContent = 'Книги не найдены. Попробуйте изменить фильтры.';
      } else {
        sorted.forEach(book => bookList.append(createBookCard(book)));
      }

      // Отрисовка избранного
      const favBooks = wishlist.getFavorites(catalog);
      if (favBooks.length === 0) {
        wishlistContainer.textContent = 'Пока ничего не добавлено';
      } else {
        favBooks.forEach(book => wishlistContainer.append(createBookCard(book)));
      }
      break;
  }
}

// ============================================================
// 5. АСИНХРОННАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================================
async function initApp() {
  state = { status: 'loading' };
  render();

  try {
    const books = await fetchBooks();
    state = { status: 'success', data: books };
  } catch (error) {
    state = { status: 'error', message: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
  
  render();
}

// Запуск приложения
initApp();

// ============================================================
// 6. ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================================

// Отправка формы (асинхронная)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMessage = '';
  if (errorContainer) errorContainer.textContent = '';

  if (state.status !== 'success') return;

  try {
    const formData = new FormData(form);
    const newBook = createBookFromForm(formData);
    
    // Создаем новый массив книг
    const newBooks = [...state.data, newBook];
    
    // Пытаемся сохранить асинхронно
    await saveBooks(newBooks);
    
    // Успех: обновляем состояние
    state = { status: 'success', data: newBooks };
    form.reset();
    render();
  } catch (error) {
    // Ошибка валидации формы (например, рейтинг > 5)
    if (error instanceof Error) {
      errorMessage = error.message;
      render();
      setTimeout(() => { errorMessage = ''; render(); }, 3000);
    }
  }
});

// Фильтры и сортировка
filterBtn.addEventListener('click', render);
searchInput.addEventListener('input', render);
sortBySelect.addEventListener('change', render);