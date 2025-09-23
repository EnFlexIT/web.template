import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const key = "dataPermissions" as const

export interface DataPermissionsState {
    accepted: boolean,
    statistics: boolean,
    comfort: boolean,
    personalised: boolean,
    mandatory: true,
}

const initialState: DataPermissionsState = {
    accepted: false,
    comfort: false,
    mandatory: true,
    personalised: false,
    statistics: false,
}

const defaultDataPermissions: DataPermissionsState = {
    ...initialState
}

export const initializeDataPermissions = createAsyncThunk(
    'dataPermissions/initialize',
    async () => {
        const storedPermissions = await AsyncStorage.getItem(key)
        if (storedPermissions) {
            try {
                return JSON.parse(storedPermissions) as DataPermissionsState ?? defaultDataPermissions
            } catch (exception) {
                return defaultDataPermissions
            }
        }
        return defaultDataPermissions
    },
)

export const dataPermissionsSlice = createSlice({
    name: 'dataPermissions',
    initialState,
    reducers: {
        setDataPermissions: (state, { payload }: PayloadAction<DataPermissionsState>) => {
            state.accepted = payload.accepted
            state.comfort = payload.comfort
            state.mandatory = payload.mandatory
            state.personalised = payload.personalised
            state.statistics = payload.statistics
            AsyncStorage.setItem(key, JSON.stringify(payload))
        }
    },
    extraReducers: (builder) => {
        builder.addCase(initializeDataPermissions.fulfilled, (state, { payload }) => {
            state.accepted = payload.accepted
            state.comfort = payload.comfort
            state.mandatory = payload.mandatory
            state.personalised = payload.personalised
            state.statistics = payload.statistics
            AsyncStorage.setItem(key, JSON.stringify(payload))
        })
    },
})

export const { setDataPermissions } = dataPermissionsSlice.actions

export const selectDataPermissions = (state: RootState) => state.dataPermissions

export default dataPermissionsSlice.reducer
