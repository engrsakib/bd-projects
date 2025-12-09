'use client'
import store, { persistor } from '@/redux/store';
import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

const ProviderWrapper : FC<{children: React.ReactNode}> = ({children}) => {
    return (
        <Provider store={store}>
            <PersistGate
                persistor={persistor}
                loading={null}
            > {children}</PersistGate>
        </Provider>
    );
};

export default ProviderWrapper;