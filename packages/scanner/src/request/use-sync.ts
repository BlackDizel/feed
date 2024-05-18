import { useCallback, useMemo, useState } from 'react';

import { useGetVols } from '~/request/use-get-vols';
import { useSyncTransactions } from '~/request/use-sync-trans';

import { useGetGroupBadges } from './use-get-group-badges';
import type { ApiHook } from './lib';

export const useSync = (
    baseUrl: string,
    pin: string | null,
    setAuth: (auth: boolean) => void,
    kitchenId: number
): ApiHook => {
    const [error, setError] = useState<any>(null);
    const [updated, setUpdated] = useState<any>(null);
    const [fetching, setFetching] = useState<any>(false);

    const { fetching: volsFetching, send: volsSend } = useGetVols(baseUrl, pin, setAuth);

    const { fetching: groupBadgesFetching, send: groupBadgesSend } = useGetGroupBadges(baseUrl, pin, setAuth);

    const { fetching: syncTransactionsFetching, send: syncTransactionsSend } = useSyncTransactions(
        baseUrl,
        pin,
        setAuth,
        kitchenId
    );

    const send = useCallback(
        ({ lastSyncStart }) => {
            if (volsFetching || syncTransactionsFetching || groupBadgesFetching) {
                return;
            }

            const updateTimeStart = +new Date();

            setFetching(true);

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            return new Promise(async (res, rej) => {
                const success = (): void => {
                    setFetching(false);
                    setError(null);
                    setUpdated(updateTimeStart);
                    res(true);
                    return;
                };

                const error = (err): void => {
                    setError(err);
                    setFetching(false);
                    rej(err);
                    return;
                };

                try {
                    const volsPromise = volsSend({
                        updated_at__from: new Date(lastSyncStart).toISOString(),
                        limit: '10000'
                    });
                    const groupBadgesPromise = groupBadgesSend({
                        created_at__from: new Date(lastSyncStart).toISOString(),
                        limit: '1000'
                    });
                    const syncTransactionsPromise = syncTransactionsSend();
                    const results = await Promise.allSettled([
                        volsPromise,
                        groupBadgesPromise,
                        syncTransactionsPromise
                    ]);
                    const rejected = results.find((res) => res.status === 'rejected');
                    if (rejected) {
                        //@ts-ignore
                        error(rejected?.reason);
                    } else {
                        success();
                    }
                } catch (e) {
                    error(e);
                }
            });
        },
        [volsFetching, syncTransactionsFetching, groupBadgesFetching, volsSend, groupBadgesSend, syncTransactionsSend]
    );

    return <ApiHook>useMemo(
        () => ({
            fetching,
            updated,
            error,
            send
        }),
        [error, fetching, send, updated]
    );
};
