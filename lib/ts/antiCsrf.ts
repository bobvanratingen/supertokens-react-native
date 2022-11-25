/* Copyright (c) 2020, VRAI Labs and/or its affiliates. All rights reserved.
 *
 * This software is licensed under the Apache License, Version 2.0 (the
 * "License") as published by the Apache Software Foundation.
 *
 * You may not use this file except in compliance with the License. You may
 * obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

import EncryptedStorage from "react-native-encrypted-storage";
import AuthHttpRequest from "./fetch";

const TOKEN_KEY = "supertokens-rn-anticsrf-key";
const ANTI_CSRF_NAME = "sAntiCsrf";

export default class AntiCSRF {
    private static tokenInfo:
        | undefined
        | {
              antiCsrf: string;
              associatedIdRefreshToken: string;
          };

    private constructor() {}

    private static async getAntiCSRFToken(): Promise<string | null> {
        if (!(await AuthHttpRequest.recipeImpl.doesSessionExist(AuthHttpRequest.config))) {
            return null;
        }

        async function getAntiCSRFFromStorage(): Promise<string | null> {
            let fromStorage = await EncryptedStorage.getItem(TOKEN_KEY);

            if (fromStorage !== null) {
                let value = "; " + fromStorage;
                let parts = value.split("; " + ANTI_CSRF_NAME + "=");

                let last = parts.pop();
                if (last !== undefined) {
                    let splitForExpiry = fromStorage.split(";");
                    let expiry = Date.parse(splitForExpiry[1].split("=")[1]);
                    let currentTime = Date.now();

                    if (expiry < currentTime) {
                        await AntiCSRF.removeToken();
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
        }

        let fromStorage = await getAntiCSRFFromStorage();
        return fromStorage;
    }

    static async getToken(associatedIdRefreshToken: string | undefined): Promise<string | undefined> {
        if (associatedIdRefreshToken === undefined) {
            AntiCSRF.tokenInfo = undefined;
            return undefined;
        }

        if (AntiCSRF.tokenInfo === undefined) {
            let antiCsrf = await this.getAntiCSRFToken();

            if (antiCsrf === null) {
                return undefined;
            }

            AntiCSRF.tokenInfo = {
                antiCsrf,
                associatedIdRefreshToken
            };
        } else if (AntiCSRF.tokenInfo.associatedIdRefreshToken !== associatedIdRefreshToken) {
            // csrf token has changed.
            AntiCSRF.tokenInfo = undefined;
            return await AntiCSRF.getToken(associatedIdRefreshToken);
        }
        return AntiCSRF.tokenInfo.antiCsrf;
    }

    // give antiCSRFToken as undefined to remove it.
    private static async setAntiCSRF(antiCSRFToken: string | undefined) {
        async function setAntiCSRFToStorage(antiCSRFToken: string | undefined, domain: string) {
            let expires: string | undefined = "Thu, 01 Jan 1970 00:00:01 GMT";
            let cookieVal = "";
            if (antiCSRFToken !== undefined) {
                cookieVal = antiCSRFToken;
                expires = undefined; // set cookie without expiry
            }

            let valueToSet = undefined;

            if (expires !== undefined) {
                valueToSet = `${ANTI_CSRF_NAME}=${cookieVal};expires=${expires};domain=${domain};path=/;samesite=lax`;
            } else {
                valueToSet = `${ANTI_CSRF_NAME}=${cookieVal};domain=${domain};expires=Fri, 31 Dec 9999 23:59:59 GMT;path=/;samesite=lax`;
            }

            await EncryptedStorage.setItem(TOKEN_KEY, valueToSet);
        }

        await setAntiCSRFToStorage(antiCSRFToken, "");
    }

    static async setItem(associatedIdRefreshToken: string | undefined, antiCsrf: string) {
        if (associatedIdRefreshToken === undefined) {
            AntiCSRF.tokenInfo = undefined;
            return;
        }

        await this.setAntiCSRF(antiCsrf);
        AntiCSRF.tokenInfo = {
            antiCsrf,
            associatedIdRefreshToken
        };
    }

    static async removeToken() {
        AntiCSRF.tokenInfo = undefined;
        await EncryptedStorage.removeItem(TOKEN_KEY);
    }
}
