import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/template/state/store/store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
