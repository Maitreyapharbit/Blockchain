import { configureStore } from '@reduxjs/toolkit';
import recallReducer from './recallSlice';
import counterfeitReducer from './counterfeitSlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
  reducer: {
    recall: recallReducer,
    counterfeit: counterfeitReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export { useAppDispatch, useAppSelector } from './hooks';