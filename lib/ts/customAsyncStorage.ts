import SQLite from 'react-native-sqlite-storage';
SQLite.enablePromise(true);

class CustomAsyncStorage {
  private static db: any;

  public static async openDatabase() {
    if (!CustomAsyncStorage.db) {
        CustomAsyncStorage.db = await SQLite.openDatabase({
        name: 'key-value.db',
        location: 'Shared',
      });

      await this.db.executeSql('CREATE TABLE IF NOT EXISTS keyValue (key text unique, value text)');
    }

    return CustomAsyncStorage.db;
  }

  public static async getItem(key: string) {
    const db = await CustomAsyncStorage.openDatabase();
    const [result] = await db.executeSql('SELECT value FROM keyValue WHERE key = ?', [key]);
    return result.rows.item(0)?.value;
  }

  public static async setItem(key: string, value: string) {
    const db = await CustomAsyncStorage.openDatabase();
    await db.executeSql('REPLACE INTO keyValue (key, value) VALUES (?,?)', [key, value]);
  }

  public static async removeItem(key: string) {
    const db = await CustomAsyncStorage.openDatabase();
    await db.executeSql('DELETE FROM keyValue WHERE key = ?', [key]);
  }
  }

export default CustomAsyncStorage;