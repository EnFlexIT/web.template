import { Modal, View } from 'react-native';
import { useAppSelector } from '../hooks/useAppSelector';
import { selectApi } from '../redux/slices/apiSlice';
import { Text } from '../components/stylistic/Text';
import { useRoute } from '@react-navigation/native';

export function HomeScreen() {

    const { awb_rest_api, dynamic_content_api } = useAppSelector(selectApi)

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>Home Screen</Text>
            <Text
                onPress={function () {
                    dynamic_content_api.defaultApi.contentMenuIDGet(-4).then(({ data }) => console.log(data))
                }}
            >Make Call</Text>
        </View>
    );
}
