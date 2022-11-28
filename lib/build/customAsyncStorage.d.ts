declare class CustomAsyncStorage {
    private static db;
    static openDatabase(): Promise<any>;
    static getItem(key: string): Promise<any>;
    static setItem(key: string, value: string): Promise<void>;
    static removeItem(key: string): Promise<void>;
}
export default CustomAsyncStorage;
