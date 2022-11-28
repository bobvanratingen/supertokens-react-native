var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import SQLite from 'react-native-sqlite-storage';
SQLite.enablePromise(true);
class CustomAsyncStorage {
    static openDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!CustomAsyncStorage.db) {
                CustomAsyncStorage.db = yield SQLite.openDatabase({
                    name: 'key-value.db',
                    location: 'Shared',
                });
                yield this.db.executeSql('CREATE TABLE IF NOT EXISTS keyValue (key text unique, value text)');
            }
            return CustomAsyncStorage.db;
        });
    }
    static getItem(key) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield CustomAsyncStorage.openDatabase();
            const [result] = yield db.executeSql('SELECT value FROM keyValue WHERE key = ?', [key]);
            return (_a = result.rows.item(0)) === null || _a === void 0 ? void 0 : _a.value;
        });
    }
    static setItem(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield CustomAsyncStorage.openDatabase();
            yield db.executeSql('REPLACE INTO keyValue (key, value) VALUES (?,?)', [key, value]);
        });
    }
    static removeItem(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield CustomAsyncStorage.openDatabase();
            yield db.executeSql('DELETE FROM keyValue WHERE key = ?', [key]);
        });
    }
}
export default CustomAsyncStorage;
