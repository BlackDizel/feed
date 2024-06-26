import React from 'react';

import { IconButton } from '~/shared/ui/icon-button/icon-button';
import { Clock } from '~/shared/ui/icons/clock';
import { mealTimes } from '~/shared/lib/utils';
import { GearAlt } from '~/shared/ui/icons/gear-alt';
import { Button } from '~/shared/ui/button/button';
import { QrScan } from '~/components/qr-scan';
import { ScanScreenStats } from '~/components/scan-screen-stats';
import { useApp } from '~/model/app-provider';
import { ScanSimulator } from '~/components/qr-scan-simulator';
import { AppViews, useView } from '~/model/view-provider';
import { useScan } from '~/model/scan-provider/scan-provider';

import css from './scan.module.css';

export const Scan = () => {
    const { setCurrentView } = useView();
    const { debugMode, isDev, mealTime } = useApp();
    const { handleScan } = useScan();

    const feedAnon = () => {
        handleScan('anon');
    };

    const handleHistoryClick = (): void => {
        setCurrentView(AppViews.HISTORY);
    };
    const handleOptionsClick = (): void => {
        setCurrentView(AppViews.SETTINGS);
    };

    return (
        <>
            <div className={css.head}>
                <IconButton onClick={handleHistoryClick}>
                    <Clock color='white' />
                </IconButton>
                <p className={css.mealTimeText}>{mealTime ? mealTimes[mealTime] : ''}</p>
                <IconButton onClick={handleOptionsClick}>
                    <GearAlt color='white' />
                </IconButton>
            </div>
            <div className={css.bottomBlock}>
                <ScanScreenStats />
                <Button onClick={feedAnon}>Кормить Анонима</Button>
            </div>

            <div className={css.overlay}></div>
            <QrScan onScan={handleScan} />
            {(isDev || debugMode === '1') && <ScanSimulator withSelection setScanResult={handleScan} />}
        </>
    );
};
