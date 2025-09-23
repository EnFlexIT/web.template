// /**
//  * this route does not live under the layout component for reasons further explained in router/router.tsx
//  * because of that, we need to apply manual styling to the overall feel page.
//  *
//  * this is exclusive to login
//  */

import { StyleSheet, withUnistyles } from "react-native-unistyles"
import { ThemedView } from "../components/themed/ThemedView"
import { ImageBackgroundComponent, Pressable, TextInput, View, StyleSheet as NativeStyleSheet, ScrollView } from "react-native"
import { H1 } from "../components/stylistic/H1"
import { Logo } from "../components/Logo"
import { StylisticTextInput } from "../components/stylistic/StylisticTextInput"
import { useTranslation } from "react-i18next"
import { Text } from "../components/stylistic/Text"
import { useRef, useState } from "react"
import { Screen } from "../components/Screen"
import { useAppSelector } from "../hooks/useAppSelector"
// import { useApi } from "../components/provider/ApiProvider"
import { useAppDispatch } from "../hooks/useAppDispatch"
import { selectApi, selectAuthenticationMethod, setJwt, login as reduxLogin, selectIp, setIp } from "../redux/slices/apiSlice"
import { ThemedAntDesign } from "../components/themed/ThemedAntDesign"
import { ThemedText } from "../components/themed/ThemedText"
import { selectLanguage, setLanguage } from "../redux/slices/languageSlice"
import { selectTheme, setTheme } from "../redux/slices/themeSlice"
import { Picker } from '@react-native-picker/picker';
import { initializeMenu } from "../redux/slices/menuSlice"


// import { View, ViewProps, TextInput, Pressable, Platform } from 'react-native';
// import { PropsWithChildren, ReactNode, useRef, useState } from 'react';
// import { Logo } from '../components/Logo';
// import { MaterialIcons } from '@expo/vector-icons';
// // import { LanguageSwitcher } from '../components/LanguageSwitcher';
// import { LanguageSwitcher } from '../components/LanguageSwitcher';
// // import { Translation } from 'enflex.it-core';
// import { AntDesign } from '@expo/vector-icons';

// // import {
// //     useLanguage,
// //     useTheme,
// //     DefaultTheme,
// //     DarkTheme,
// //     Body,
// //     Routing
// // } from 'enflex.it-core';
// // import {
// //   Text,
// //   StylisticDropdown,
// //   StylisticTextInput,
// //   H1,
// // } from 'enflex.it-styled-ui';
// import { Text } from '../components/stylistic/Text';
// import { StylisticDropdown } from '../components/stylistic/StylisticDropdown';
// import { StylisticTextInput } from '../components/stylistic/StylisticTextInput';
// import { H1 } from '../components/stylistic/H1';

// // import { useApi } from '../provider/ApiProvider';
// // import { useJwt } from '../provider/JwtProvider';
// import { useUnistyles } from 'react-native-unistyles';
// import { useTranslation } from 'react-i18next';

// function Border(props: PropsWithChildren<ViewProps>) {
//     const { theme } = useUnistyles();
//     return (
//         <View
//             {...props}
//             style={[
//                 {
//                     padding: 5,
//                     borderColor: theme.colors.border,
//                     borderWidth: 1,
//                     borderRadius: 10,
//                 },
//                 props.style,
//             ]}
//         />
//     );
// }

// function Message(props: { message: string; type: 'good' | 'bad' } & ViewProps) {
//     const { theme } = useUnistyles()

//     return (
//         <View
//             style={[
//                 {
//                     padding: 10,
//                     // backgroundColor: props.type === 'bad' ? theme.colors.warning_background : theme.colors.success_background,
//                     borderRadius: 5,
//                     // borderColor:
//                     //     props.type === 'bad'
//                     //         ? theme.colors.warning_border
//                     //         : theme.colors.success_border,
//                     borderWidth: 1,
//                     flexDirection: 'row',
//                     justifyContent: 'space-between',
//                     alignItems: 'center',
//                 },
//                 props.style,
//             ]}
//         >
//             <Text style={{
//                 // color: theme.colors.warning_text_color
//             }}>
//                 {props.message}
//             </Text>
//             <AntDesign
//                 name="warning"
//                 size={24}
//             // color={theme.colors.warning_text_color}
//             />
//         </View>
//     );
// }

// export function LoginScreen() {
//     const { t } = useTranslation(['Login']);

//     const [onSubmit, setOnSubmit] = useState(false);
//     const [message, setMessage] = useState<{
//         message: string;
//         type: 'good' | 'bad';
//     }>({ message: '', type: 'good' });
//     const [credentials, setCredentials] = useState({
//         username: '',
//         password: '',
//     });
//     const [advancedOptionsOpen, setAdvancedOptionsOpen] = useState(false);

//     // const { ip, setIP } = useIP();
//     const { theme } = useUnistyles();
//     // const { setJwt } = useJwt();

//     // const data = Routing.useLoaderData();
//     // const navigate = Routing.useNavigate();

//     const usernameRef = useRef<TextInput>(null);
//     const passwordRef = useRef<TextInput>(null);

//     // const { language, setLanguage } = useLanguage();

//     const width = 150;
//     const minHeight = 50;

//     const textFieldHeight = 20;

//     // const { awb_rest_api: { userApi } } = useApi()

//     // const {
//     //   apis: {
//     //     restApi: { userApi },
//     //   },
//     // } = useApi();

//     const advancedOptionsElements: ReactNode[] = [
//         <View style={{ gap: 5 }}>
//             <Text>{t('language')}:</Text>
//             <Border>
//                 <LanguageSwitcher
//                     style={{
//                         height: 20,
//                         //Remove the default width option
//                         width: 'auto',
//                     }}
//                 />
//             </Border>
//         </View>,
//         // <View style={{ gap: 5 }}>
//         //     <Text>{t('color-scheme')}:</Text>
//         //     <Border>
//         //         <StylisticDropdown
//         //             data={[
//         //                 { label: 'Lightmode', value: DefaultTheme },
//         //                 { label: 'Darkmode', value: DarkTheme },
//         //             ]}
//         //             labelField="label"
//         //             valueField="value"
//         //             onChange={({ value }) => {
//         //                 setTheme(value);
//         //             }}
//         //             placeholder={theme === DefaultTheme ? 'Lightmode' : 'Darkmode'}
//         //             style={{ height: 20 }}
//         //         />
//         //     </Border>
//         // </View>,
//         // __DEV__ ? (
//         //     <View style={{ gap: 5 }}>
//         //         <Text>Fake Login:</Text>
//         //         <Border>
//         //             <Pressable
//         //                 onPress={() => {
//         //                     setJwt(' ');
//         //                 }}
//         //             >
//         //                 <Routing.Link to={data ? data : '/'}>
//         //                     <Text>False Login</Text>
//         //                 </Routing.Link>
//         //             </Pressable>
//         //         </Border>
//         //     </View>
//         // ) : undefined,
//         <View style={{ gap: 5 }}>
//             <Text>Agent.Workbench - IP:</Text>
//             <Border>
//                 <StylisticTextInput
//                     placeholder={t('ip_adress')}
//                     style={{ height: textFieldHeight }}
//                 // onChangeText={setIP}
//                 // value={ip}
//                 />
//             </Border>
//         </View>

//     ];

//     const confirmCredentials = async function () {
//         // try {
//         //     const res = await userApi.loginUser({ auth: credentials })
//         //     switch (res.status) {
//         //         case 200:
//         //             const [_, jwt] = res.data.split(' ');
//         //             setJwt(jwt);
//         //             if (data) navigate(data);
//         //             else navigate('/');

//         //             setCredentials({ username: '', password: '' });
//         //             setMessage({ message: '', type: 'good' });

//         //             break;
//         //         default:
//         //             setMessage({ message: 'Wrong Credentials!', type: 'bad' });
//         //             setCredentials({ username: '', password: '' });
//         //             if (usernameRef.current) usernameRef.current.focus();
//         //             break;
//         //     }
//         // } catch (exception) {
//         //     setMessage({ message: `Something went wrong\n${exception}`, type: 'bad' });
//         //     setCredentials({ username: '', password: '' });
//         //     if (usernameRef.current) usernameRef.current.focus();
//         // }
//     }

//     return (
//         <View
//             style={{
//                 backgroundColor: theme.colors.background,
//                 flex: 1,
//             }}
//         >
//             {/* <Body> */}
//             <View
//                 style={{
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                     flex: 1,
//                     alignSelf: 'stretch',
//                 }}
//             >
//                 <View
//                     style={{
//                         backgroundColor: theme.colors.card,
//                         padding: 10,
//                         gap: 20,
//                         justifyContent: 'center',
//                         alignItems: 'center',
//                         borderRadius: 15,
//                         width: 300,
//                     }}
//                 >
//                     <View
//                         style={{
//                             minHeight: minHeight,
//                             flexDirection: 'row',
//                             justifyContent: 'center',
//                             alignItems: 'baseline',
//                             gap: 10,
//                             width: '90%',
//                             marginTop: 20,
//                         }}
//                     >
//                         <Logo
//                             style={{ resizeMode: 'contain', width: 45, height: 38 }}
//                         />
//                         <H1>{process.env.EXPO_PUBLIC_APPLICATION_TITLE}</H1>
//                     </View>

//                     <View style={{ gap: 5, minHeight: minHeight, width: '80%' }}>
//                         <Border>
//                             <StylisticTextInput
//                                 style={{ height: textFieldHeight }}
//                                 placeholder={t('username_placeholder')}
//                                 onChangeText={(e) => {
//                                     setCredentials({ ...credentials, username: e });
//                                 }}
//                                 enterKeyHint="next"
//                                 onSubmitEditing={() =>
//                                     passwordRef.current && passwordRef.current.focus()
//                                 }
//                                 // ref={(e) =>
//                                 //     (usernameRef.current = e ?? usernameRef.current)
//                                 // }
//                                 value={credentials.username}
//                             />
//                         </Border>
//                         <Border>
//                             <StylisticTextInput
//                                 style={{ height: textFieldHeight }}
//                                 placeholder={t('password_placeholder')}
//                                 secureTextEntry
//                                 onChangeText={(e) => {
//                                     setCredentials({ ...credentials, password: e });
//                                 }}
//                                 onSubmitEditing={() => confirmCredentials()}
//                                 // ref={(e) =>
//                                 //     (passwordRef.current = e ?? passwordRef.current)
//                                 // }
//                                 value={credentials.password}
//                             />
//                         </Border>
//                     </View>
//                     <View>
//                         <Pressable
//                             onHoverIn={() => setOnSubmit(true)}
//                             onHoverOut={() => setOnSubmit(false)}
//                             onPress={() => {
//                                 confirmCredentials();
//                             }}
//                         >
//                             <View
//                                 style={{
//                                     // backgroundColor: theme.colors.submit_color,
//                                     borderColor: 'darkgrey',
//                                     borderRadius: 5,
//                                     borderWidth: 1,
//                                     alignItems: 'center',
//                                     padding: 5,
//                                 }}
//                             >
//                                 <Text
//                                     style={{
//                                         textAlign: 'center',
//                                         width: width,
//                                         // color: onSubmit
//                                         //     ? theme.colors.highlight
//                                         //     : undefined,
//                                     }}
//                                 >
//                                     {t('login')}
//                                 </Text>
//                             </View>
//                         </Pressable>
//                     </View>
//                     <View
//                         style={{
//                             width: '80%',
//                             gap: 10,
//                         }}
//                     >
//                         <Pressable
//                             onPress={(e) => {
//                                 setAdvancedOptionsOpen(!advancedOptionsOpen);
//                             }}
//                         >
//                             <View
//                                 style={{
//                                     flexDirection: 'row',
//                                     alignItems: 'center',
//                                 }}
//                             >
//                                 <MaterialIcons
//                                     name={
//                                         advancedOptionsOpen ? 'arrow-drop-down' : 'arrow-right'
//                                     }
//                                     size={24}
//                                     color={theme.colors.text}
//                                 />
//                                 <Text>{t('advanced_options')}</Text>
//                             </View>
//                         </Pressable>
//                         {advancedOptionsOpen && (
//                             <View style={{ gap: 10 }}>
//                                 {advancedOptionsElements.map((val, idx) => {
//                                     return <View key={idx}>{val}</View>;
//                                 })}
//                             </View>
//                         )}
//                     </View>
//                     <View
//                         style={{
//                             minHeight: minHeight,
//                             justifyContent: 'center',
//                             alignItems: 'center',
//                             flex: 1,
//                             height: 70,
//                         }}
//                     >
//                         {!(message.message === '') && (
//                             <Message
//                                 {...message}
//                                 style={{ width: '80%', marginBottom: 20 }}
//                             />
//                         )}
//                     </View>
//                 </View>
//             </View>
//             {/* </Body> */}
//         </View>
//     );
// }

export function LoginScreen() {

    const { t } = useTranslation(['Login']);
    const [highlight, setHighlight] = useState(false)
    const dispatch = useAppDispatch()
    const authenticationMethod = useAppSelector(selectAuthenticationMethod)

    styles.useVariants({
        highlight: highlight,
    })

    const usernameFieldRef = useRef<TextInput>(null)
    const passwordFieldRef = useRef<TextInput>(null)
    const loginButtonRef = useRef<View>(null)

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    const { awb_rest_api } = useAppSelector(selectApi)

    const [folded, setFolded] = useState(true)

    const language = useAppSelector(selectLanguage)
    const theme = useAppSelector(selectTheme)
    const ip = useAppSelector(selectIp)

    const [ipField, setIpField] = useState(ip)

    async function login() {
        switch (authenticationMethod) {
            case "jwt": {
                const response = await awb_rest_api.userApi.loginUser({
                    auth: {
                        password: password,
                        username: username,
                    }
                })

                if (response.status === 200) {
                    const www_authenticate = response.headers["www-authenticate"] as string
                    const bearerToken = www_authenticate.split(' ')[1]
                    dispatch(reduxLogin(bearerToken))
                }
                break;
            }
            case "oidc": {
                console.warn("login has been called while the authenticationMethod=oidc. this should never be the case and needs investigation")
                break
            }
        }


    }

    return (
        <View style={[styles.container]}>
            <View>
                <View style={[styles.widget, styles.border]}>
                    <View style={[styles.upperHalf]}>
                        <View style={[styles.titleContainer]}>
                            <Logo
                                style={logoStyles.logo}
                            />
                            <H1>{process.env.EXPO_PUBLIC_APPLICATION_TITLE}</H1>
                        </View>
                        <StylisticTextInput
                            ref={usernameFieldRef}
                            style={[styles.border, styles.padding]}
                            placeholder={t('username_placeholder')}
                            onSubmitEditing={() => passwordFieldRef.current?.focus()}
                            textContentType="username"
                            onChangeText={setUsername}
                            value={username}
                        />
                        <StylisticTextInput
                            ref={passwordFieldRef}
                            style={[styles.border, styles.padding]}
                            placeholder={t('password_placeholder')}
                            onSubmitEditing={() => loginButtonRef.current?.focus()}
                            textContentType="password"
                            secureTextEntry
                            onChangeText={setPassword}
                            value={password}
                        />
                        <Pressable
                            ref={loginButtonRef}
                            style={[styles.border, styles.padding, styles.loginContainer]}
                            onHoverIn={() => setHighlight(true)}
                            onHoverOut={() => setHighlight(false)}
                            onFocus={() => setHighlight(true)}
                            onPress={() => {
                                setHighlight(false)
                                login()
                            }}
                        >
                            <Text style={[styles.login]}>{t('login')}</Text>
                        </Pressable>
                    </View>
                    <View style={[styles.lowerHalf]}>
                        <Pressable
                            style={[styles.advancedSettingsTitleContainer]}
                            onPress={() => setFolded(!folded)}
                        >
                            <Text>Erweiterte Einstellungen</Text>
                            <ThemedAntDesign name={folded ? "down" : "up"} />
                        </Pressable>
                        {
                            !folded &&
                            <ScrollView contentContainerStyle={[styles.advancedItemsContainer]}>
                                <View>
                                    <ThemedText>{t('lng')}:</ThemedText>
                                    <Picker
                                        selectedValue={language.language}
                                        onValueChange={(itemValue) =>
                                            dispatch(setLanguage({
                                                language: itemValue,
                                            }))
                                        }
                                    >
                                        <Picker.Item
                                            label="Deutsch"
                                            value="de"
                                        />
                                        <Picker.Item
                                            label="Englisch"
                                            value="en"
                                        />
                                    </Picker>
                                </View>
                                <View>
                                    <ThemedText>{t("colorscheme")}:</ThemedText>
                                    <Picker
                                        selectedValue={theme.val.adaptive ? 'system' : theme.val.theme}
                                        onValueChange={(itemValue) => {
                                            dispatch(setTheme({
                                                val: {
                                                    adaptive: (itemValue === "system") ? true : false,
                                                    theme: (itemValue === "system") ? theme.val.theme : itemValue,
                                                }
                                            }))
                                        }}
                                    >
                                        <Picker.Item label={t("system")} value='system' />
                                        <Picker.Item label={t("light")} value='light' />
                                        <Picker.Item label={t("dark")} value="dark" />
                                    </Picker>
                                </View>
                                <View>
                                    <ThemedText>Ip:</ThemedText>
                                    <StylisticTextInput
                                        value={ipField}
                                        style={[styles.border, styles.padding]}
                                        onChangeText={async function (text) {
                                            setIpField(text)
                                        }}
                                        onSubmitEditing={function ({ nativeEvent: { text } }) {
                                            dispatch(setIp(text))
                                        }}
                                    />
                                </View>
                            </ScrollView>
                        }
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create((theme, rt) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    widget: {
        padding: 10,
        backgroundColor: theme.colors.card,
        gap: 5,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: 10,
    },
    logo: {
        tintColor: theme.colors.text
    },
    padding: {
        padding: 5,
    },
    loginContainer: {
        variants: {
            highlight: {
                true: {
                    backgroundColor: theme.colors.highlight,
                }
            }
        },
    },
    login: {
        textAlign: "center"
    },
    border: {
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    upperHalf: {
        gap: 5,
    },
    lowerHalf: {
        gap: 5,
    },
    advancedSettingsTitleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        userSelect: "none"
    },
    advancedItemsContainer: {
        gap: 5,
    },
    advancedItemContainer: {

    }
}))

const logoStyles = NativeStyleSheet.create({
    logo: {
        resizeMode: 'contain',
        width: 38,
        height: 38,
    }
})
