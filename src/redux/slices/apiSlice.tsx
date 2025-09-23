import { createSlice, isPlainObject, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { AdminsApi, Configuration as RestApiConfiguration, DoActionApi, InfoApi, UserApi } from '../../api/implementation/AWB-RestAPI';
import { Configuration as DynamicContentApiConfiguration, DefaultApi } from '../../api/implementation/Dynamic-Content-Api';
import { createAsyncThunk, } from '@reduxjs/toolkit'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode"
import { initializeMenu } from './menuSlice';

const defaultAuthenticationMethod = "jwt"
const ipKey = "ip" as const
const defaultIp: string = __DEV__ ? process.env.EXPO_PUBLIC_DEFAULT_DEV_IP : process.env.EXPO_PUBLIC_DEFAULT_PROD_IP
const defaultJwt = null
const jwtKey = "jwt" as const

async function isIpPointingToServer(ip: string) {
    const infoApi = new InfoApi({
        isJsonMime: new RestApiConfiguration().isJsonMime,
        basePath: `${ip}/api`,
    })

    const { data, status } = await infoApi.getAppSettings()

    switch (status) {
        case 200: {
            const authenticationMethodPointer = data.propertyEntries.find(({ key }) => key === "_ServerWideSecurityConfiguration")
            if (authenticationMethodPointer) {
                return true
            } else {
                return false
            }
        }
        default: {
            return false
        }
    }
}

export interface ApiState {
    awb_rest_api: {
        adminsApi: AdminsApi;
        userApi: UserApi;
        infoApi: InfoApi;
        doActionApi: DoActionApi;
    };
    dynamic_content_api: {
        defaultApi: DefaultApi;
    };
    authenticationMethod: "oidc" | "jwt";
    ip: string,
    jwt: string | null,
    isLoggedIn: boolean,
    isPointingToServer: boolean,
}

export const initializeApi = createAsyncThunk(
    'api/initialize',
    async (): Promise<ApiState> => {
        /**
         * Firstly we fetch the ip that is stored. This ip should be pointing to an awb server
         */
        const ip = await AsyncStorage.getItem(ipKey) ?? defaultIp

        /**
         * Secondely we get the jwt token
         */
        const jwt = await AsyncStorage.getItem(jwtKey) ?? defaultJwt

        /**
         * Then we instantiate an infoApi.
         * We will use this api object to query some information about the server with which we are going to interact with
         */
        const infoApi = new InfoApi({
            isJsonMime: new RestApiConfiguration().isJsonMime,
            basePath: `${ip}/api`,
        })

        /**
         * We will try calling the api now
         */
        try {
            const { data, status } = await infoApi.getAppSettings()

            /**
             * We can now switch over wether the call succeeded or failed
             */
            switch (status) {
                case 200: {
                    /**
                     * Next we are goin to check what security handler the awb server uses
                     */
                    const authenticationMethodPointer = data.propertyEntries.find(({ key }) => key === "_ServerWideSecurityConfiguration")

                    /**
                     * We have to validate that the reponse actually contains the field we are looking for
                     */
                    if (authenticationMethodPointer) {
                        const { value: authenticationMethod } = authenticationMethodPointer

                        switch (authenticationMethod) {
                            case "JwtSingleUserSecurityHandler": {
                                /**
                                 * Check if the given jwt's expiration date is greater than the current time
                                 * if not, return isLoggedIn = false
                                 * We multiply by 1000 because Christian's time is missing three decimal points.
                                 */
                                const isLoggedIn = jwt ? (jwtDecode(jwt).exp ?? 0) * 1000 > Date.now() : false

                                const rest_api_conf: RestApiConfiguration = {
                                    isJsonMime: new RestApiConfiguration().isJsonMime,
                                    basePath: `${ip}/api`,
                                    baseOptions: { headers: { Authorization: `Bearer ${jwt}`, }, }
                                };

                                const restAPI = {
                                    adminsApi: new AdminsApi(rest_api_conf),
                                    userApi: new UserApi(rest_api_conf),
                                    infoApi: new InfoApi(rest_api_conf),
                                    doActionApi: new DoActionApi(rest_api_conf),
                                };

                                const dynamic_content_api_conf: DynamicContentApiConfiguration = {
                                    isJsonMime: new DynamicContentApiConfiguration().isJsonMime,
                                    basePath: `${ip}/dc`,
                                    baseOptions: { headers: { Authorization: `Bearer ${jwt}`, }, }
                                }

                                const dynamicContentApi = {
                                    defaultApi: new DefaultApi(dynamic_content_api_conf)
                                }

                                return {
                                    authenticationMethod: "jwt",
                                    awb_rest_api: restAPI,
                                    dynamic_content_api: dynamicContentApi,
                                    ip: ip,
                                    isLoggedIn: isLoggedIn,
                                    isPointingToServer: true,
                                    jwt: jwt
                                }
                            }
                            case "OIDCSecurityHandler": {

                                const rest_api_conf: RestApiConfiguration = {
                                    isJsonMime: new RestApiConfiguration().isJsonMime,
                                    basePath: `${ip}/api`,
                                };

                                const restAPI = {
                                    adminsApi: new AdminsApi(rest_api_conf),
                                    userApi: new UserApi(rest_api_conf),
                                    infoApi: new InfoApi(rest_api_conf),
                                    doActionApi: new DoActionApi(rest_api_conf),
                                };

                                const dynamic_content_api_conf: DynamicContentApiConfiguration = {
                                    isJsonMime: new DynamicContentApiConfiguration().isJsonMime,
                                    basePath: `${ip}/dc`,
                                }

                                const dynamicContentApi = {
                                    defaultApi: new DefaultApi(dynamic_content_api_conf)
                                }

                                const isLoggedInPointer = data.propertyEntries.find(({ key }) => key === "_Authenticated")

                                return {
                                    authenticationMethod: "oidc",
                                    awb_rest_api: restAPI,
                                    dynamic_content_api: dynamicContentApi,
                                    ip: ip,
                                    isLoggedIn: isLoggedInPointer ? isLoggedInPointer.value === "true" : false,
                                    isPointingToServer: true,
                                    jwt: jwt,
                                }
                            }
                        }
                    }
                    /**
                     * In this case we could call the info Api but the reponse did not include any information about the security handler
                     * that the server uses. we therefore cannot query any more information and return
                     */
                    else {
                        console.warn(`api initialization could find server on ${ip} which responded with 200 on getAppSettings() call but there was no _ServerWideSecurityConfiguration field in response`)
                        return {
                            authenticationMethod: 'jwt',
                            awb_rest_api: {
                                adminsApi: new AdminsApi(),
                                doActionApi: new DoActionApi(),
                                infoApi: new InfoApi(),
                                userApi: new UserApi(),
                            },
                            dynamic_content_api: {
                                defaultApi: new DefaultApi(),
                            },
                            ip: ip,
                            isLoggedIn: false,
                            isPointingToServer: false,
                            jwt: jwt
                        }
                    }
                }
                default: {
                    return {
                        authenticationMethod: 'jwt',
                        awb_rest_api: {
                            adminsApi: new AdminsApi(),
                            doActionApi: new DoActionApi(),
                            infoApi: new InfoApi(),
                            userApi: new UserApi(),
                        },
                        dynamic_content_api: {
                            defaultApi: new DefaultApi(),
                        },
                        ip: ip,
                        isLoggedIn: false,
                        isPointingToServer: false,
                        jwt: jwt
                    }
                }
            }
        }
        /**
         * If the api call failed, we can be certain that we cannot reach an awb server at the provided ip.
         * we therefore return a configuration that represents a false state
         */
        catch (exception) {
            console.log("no server")
            return {
                authenticationMethod: 'jwt',
                awb_rest_api: {
                    adminsApi: new AdminsApi(),
                    doActionApi: new DoActionApi(),
                    infoApi: new InfoApi(),
                    userApi: new UserApi(),
                },
                dynamic_content_api: {
                    defaultApi: new DefaultApi(),
                },
                ip: ip,
                isLoggedIn: false,
                isPointingToServer: false,
                jwt: jwt
            }
        }
    },
)

export const login = createAsyncThunk(
    'api/login',
    async (jwt: string, thunkAPI) => {
        await thunkAPI.dispatch(setJwt(jwt))
        await thunkAPI.dispatch(initializeMenu())
    }
)

const initialState: ApiState = {
    awb_rest_api: {
        adminsApi: new AdminsApi(),
        userApi: new UserApi(),
        infoApi: new InfoApi(),
        doActionApi: new DoActionApi(),
    },
    dynamic_content_api: {
        defaultApi: new DefaultApi(),
    },
    authenticationMethod: defaultAuthenticationMethod,
    ip: defaultIp,
    jwt: defaultJwt,
    isLoggedIn: false,
    isPointingToServer: false,
}

export const apiSlice = createSlice({
    name: 'api',
    initialState,
    reducers: {
        setIp: function (state, action: PayloadAction<string>) {
            let rest_api_conf: RestApiConfiguration;
            let dynamic_content_api_conf: DynamicContentApiConfiguration;

            switch (state.authenticationMethod) {
                case "jwt":
                    rest_api_conf = {
                        isJsonMime: new RestApiConfiguration().isJsonMime,
                        basePath: `${action.payload}/api`,
                        baseOptions: { headers: { Authorization: `Bearer ${state.jwt}`, }, }
                    };
                    dynamic_content_api_conf = {
                        isJsonMime: new DynamicContentApiConfiguration().isJsonMime,
                        basePath: `${action.payload}/dc`,
                        baseOptions: { headers: { Authorization: `Bearer ${state.jwt}`, }, }
                    }
                    break;
                case "oidc":
                    rest_api_conf = {
                        isJsonMime: new RestApiConfiguration().isJsonMime,
                        basePath: `${action.payload}/api`,
                    };
                    dynamic_content_api_conf = {
                        isJsonMime: new DynamicContentApiConfiguration().isJsonMime,
                        basePath: `${action.payload}/dc`,
                    }
                    break;
            }

            const restAPI = {
                adminsApi: new AdminsApi(rest_api_conf),
                userApi: new UserApi(rest_api_conf),
                infoApi: new InfoApi(rest_api_conf),
                doActionApi: new DoActionApi(rest_api_conf),
            };

            const dynamicContentApi = {
                defaultApi: new DefaultApi(dynamic_content_api_conf)
            }

            state.awb_rest_api = restAPI
            state.dynamic_content_api = dynamicContentApi
            state.ip = action.payload
            isIpPointingToServer(action.payload).then(is => state.isPointingToServer = is)
            AsyncStorage.setItem(ipKey, action.payload)
        },
        setAuthenticationMethod: function (state, action: PayloadAction<"jwt" | "oidc">) {
            let rest_api_conf: RestApiConfiguration;
            let dynamic_content_api_conf: DynamicContentApiConfiguration;

            switch (action.payload) {
                case "jwt":
                    rest_api_conf = {
                        isJsonMime: new RestApiConfiguration().isJsonMime,
                        basePath: `${state.ip}/api`,
                        baseOptions: { headers: { Authorization: `Bearer ${state.jwt}`, }, }
                    };
                    dynamic_content_api_conf = {
                        isJsonMime: new DynamicContentApiConfiguration().isJsonMime,
                        basePath: `${state.ip}/dc`,
                        baseOptions: { headers: { Authorization: `Bearer ${state.jwt}`, }, }
                    }
                    break;

                case "oidc":
                    rest_api_conf = {
                        isJsonMime: new RestApiConfiguration().isJsonMime,
                        basePath: `${state.ip}/api`,
                    };
                    dynamic_content_api_conf = {
                        isJsonMime: new DynamicContentApiConfiguration().isJsonMime,
                        basePath: `${state.ip}/dc`,
                    }
                    break;

            }
            const restAPI = {
                adminsApi: new AdminsApi(rest_api_conf),
                userApi: new UserApi(rest_api_conf),
                infoApi: new InfoApi(rest_api_conf),
                doActionApi: new DoActionApi(rest_api_conf),
            };
            const dynamicContentApi = {
                defaultApi: new DefaultApi(dynamic_content_api_conf)
            }
            state.authenticationMethod = action.payload
            state.awb_rest_api = restAPI
            state.dynamic_content_api = dynamicContentApi
        },
        setJwt: function (state, action: PayloadAction<string | null>) {
            let rest_api_conf: RestApiConfiguration;
            let dynamic_content_api_conf: DynamicContentApiConfiguration;

            switch (state.authenticationMethod) {
                case "jwt":
                    rest_api_conf = {
                        isJsonMime: new RestApiConfiguration().isJsonMime,
                        basePath: `${state.ip}/api`,
                        baseOptions: { headers: { Authorization: `Bearer ${action.payload}`, }, }
                    };
                    dynamic_content_api_conf = {
                        isJsonMime: new DynamicContentApiConfiguration().isJsonMime,
                        basePath: `${state.ip}/dc`,
                        baseOptions: { headers: { Authorization: `Bearer ${action.payload}`, }, }
                    }
                    break;
                case "oidc":
                    rest_api_conf = {
                        isJsonMime: new RestApiConfiguration().isJsonMime,
                        basePath: `${state.ip}/api`,
                    };
                    dynamic_content_api_conf = {
                        isJsonMime: new DynamicContentApiConfiguration().isJsonMime,
                        basePath: `${state.ip}/dc`,
                    }
                    break;

            }
            const restAPI = {
                adminsApi: new AdminsApi(rest_api_conf),
                userApi: new UserApi(rest_api_conf),
                infoApi: new InfoApi(rest_api_conf),
                doActionApi: new DoActionApi(rest_api_conf),
            };

            const dynamicContentApi = {
                defaultApi: new DefaultApi(dynamic_content_api_conf)
            }

            state.awb_rest_api = restAPI
            state.dynamic_content_api = dynamicContentApi
            state.jwt = action.payload
            if (action.payload) {
                AsyncStorage.setItem(jwtKey, action.payload)
            } else {
                AsyncStorage.removeItem(jwtKey)
            }
        },
        logout: function (state) {
            state.isLoggedIn = false
            switch (state.authenticationMethod) {
                case "jwt": {
                    AsyncStorage.removeItem(jwtKey)
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(initializeApi.fulfilled, (state, action) => {
                // console.log("started")
                state.authenticationMethod = action.payload.authenticationMethod

                state.awb_rest_api = action.payload.awb_rest_api

                state.dynamic_content_api = action.payload.dynamic_content_api

                state.ip = action.payload.ip
                AsyncStorage.setItem(ipKey, action.payload.ip)

                state.isLoggedIn = action.payload.isLoggedIn

                state.isPointingToServer = action.payload.isPointingToServer

                state.jwt = action.payload.jwt
                if (action.payload.jwt) {
                    AsyncStorage.setItem(jwtKey, action.payload.jwt)
                } else {
                    AsyncStorage.removeItem(jwtKey)
                }

                // console.log("finished")
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoggedIn = true
            })
    },
})

export const { setIp, setAuthenticationMethod, setJwt, logout } = apiSlice.actions

export const selectApi = (state: RootState) => state.api
export const selectJwt = (state: RootState) => state.api.jwt
export const selectIp = (state: RootState) => state.api.ip
export const selectAuthenticationMethod = (state: RootState) => state.api.authenticationMethod
export const selectIsLoggedIn = (state: RootState) => state.api.isLoggedIn

export default apiSlice.reducer
