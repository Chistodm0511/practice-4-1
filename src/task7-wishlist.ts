import { Book } from "./task1-types";
import { BookCatalog } from "./task6-classes";

// ============================================================
// Практика 3.2: Вишлист (Избранное)
// ============================================================
// Класс хранит только id книг, а полные данные получает
// из BookCatalog через композицию. Это гарантирует, что
// вишлист всегда показывает актуальное состояние каталога.
// ============================================================

export class Wishlist {
  private favoriteIds: string[] = [];

  constructor(favoriteIds: string[] = []) {
    this.favoriteIds = favoriteIds;
  }

  // Иммутабельное переключение: добавляет или удаляет id
  toggle(id: string): void {
    if (this.favoriteIds.includes(id)) {
      this.favoriteIds = this.favoriteIds.filter(i => i !== id);
    } else {
      this.favoriteIds = [...this.favoriteIds, id];
    }
  }

  has(id: string): boolean {
    return this.favoriteIds.includes(id);
  }

  getFavoriteIds(): string[] {
    return this.favoriteIds;
  }

  get count(): number {
    return this.favoriteIds.length;
  }

  // Композиция: получаем полные объекты книг из каталога
  getFavorites(catalog: BookCatalog): Book[] {
    return catalog.getBooks().filter(book => this.favoriteIds.includes(book.id));
  }

  // Метод для сохранения в localStorage (используется в main.ts)
  getIds(): string[] {
    return [...this.favoriteIds];
  }
}