import { useSelector } from 'react-redux'
import type { RootState } from '@/template/state/store/store'

export const useAppSelector = useSelector.withTypes<RootState>()
