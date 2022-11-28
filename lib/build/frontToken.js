var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function(resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
import EncryptedStorage from "react-native-encrypted-storage";
import AuthHttpRequest from "./fetch";
import IdRefreshToken from "./idRefreshToken";
import { decode as atob } from "base-64";
const FRONT_TOKEN_KEY = "supertokens-rn-front-token-key";
const FRONT_TOKEN_NAME = "sFrontToken";
export default class FrontToken {
    constructor() {}
    static getFrontToken() {
        return __awaiter(this, void 0, void 0, function*() {
            if (!(yield AuthHttpRequest.recipeImpl.doesSessionExist(AuthHttpRequest.config))) {
                return null;
            }
            function getFrontTokenFromStorage() {
                return __awaiter(this, void 0, void 0, function*() {
                    let frontTokenFromStorage = yield EncryptedStorage.getItem(FRONT_TOKEN_KEY);
                    console.log("frontTokenFromStorage", frontTokenFromStorage);

                    if (frontTokenFromStorage !== null && frontTokenFromStorage !== undefined) {
                        let value = "; " + frontTokenFromStorage;
                        let parts = value.split("; " + FRONT_TOKEN_NAME + "=");
                        let last = parts.pop();
                        if (last !== undefined) {
                            let splitForExpiry = frontTokenFromStorage.split(";");
                            let expiry = Date.parse(splitForExpiry[1].split("=")[1]);
                            let currentTime = Date.now();
                            if (expiry < currentTime) {
                                yield FrontToken.removeToken();
                                return null;
                            }
                            let temp = last.split(";").shift();
                            if (temp === undefined) {
                                return null;
                            }
                            return temp;
                        }
                    }
                    return null;
                });
            }
            let token = yield getFrontTokenFromStorage();
            return token;
        });
    }
    static getTokenInfo() {
        return __awaiter(this, void 0, void 0, function*() {
            let frontToken = yield this.getFrontToken();
            if (frontToken === null) {
                if ((yield IdRefreshToken.getIdRefreshToken(false)).status === "EXISTS") {
                    // this means that the id refresh token has been set, so we must
                    // wait for this to be set or removed
                    yield new Promise(resolve => {
                        FrontToken.waiters.push(resolve);
                    });
                    return FrontToken.getTokenInfo();
                } else {
                    return undefined;
                }
            }
            return JSON.parse(decodeURIComponent(escape(atob(frontToken))));
        });
    }
    static setFrontToken(frontToken) {
        return __awaiter(this, void 0, void 0, function*() {
            function setFrontTokenToStorage(frontToken, domain) {
                return __awaiter(this, void 0, void 0, function*() {
                    let expires = "Thu, 01 Jan 1970 00:00:01 GMT";
                    let cookieVal = "";
                    if (frontToken !== undefined) {
                        cookieVal = frontToken;
                        expires = undefined; // set cookie without expiry
                    }
                    let valueToSet = undefined;
                    if (expires !== undefined) {
                        valueToSet = `${FRONT_TOKEN_NAME}=${cookieVal};expires=${expires};domain=${domain};path=/;samesite=lax`;
                    } else {
                        valueToSet = `${FRONT_TOKEN_NAME}=${cookieVal};domain=${domain};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=lax`;
                    }
                    yield EncryptedStorage.setItem(FRONT_TOKEN_KEY, valueToSet);
                });
            }
            yield setFrontTokenToStorage(frontToken, "");
        });
    }
    static removeToken() {
        return __awaiter(this, void 0, void 0, function*() {
            yield this.setFrontToken(undefined);
            FrontToken.waiters.forEach(f => f(undefined));
            FrontToken.waiters = [];
        });
    }
    static setItem(frontToken) {
        return __awaiter(this, void 0, void 0, function*() {
            yield this.setFrontToken(frontToken);
            FrontToken.waiters.forEach(f => f(undefined));
            FrontToken.waiters = [];
        });
    }
}
// these are waiters for when the idRefreshToken has been set, but this token has
// not yet been set. Once this token is set or removed, the waiters are resolved.
FrontToken.waiters = [];
