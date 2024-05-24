import type { FC } from 'react';

import { CardContainer } from '~/components/post-scan/post-scan-cards/ui/card-container/card-container';
import { Button } from '~/shared/ui/button/button';
import { Text, Title } from '~/shared/ui/typography';
import { VolAndUpdateInfo } from '~/components/vol-and-update-info';

import css from './feed-anon-card.module.css';

export const FeedAnonCard: FC<{
    close: () => void;
    doFeed: (isVegan?: boolean) => void;
    onClickFeedGroup: () => void;
}> = ({ close, doFeed, onClickFeedGroup }) => (
    <CardContainer className={css.cardContainer}>
        <div className={css.head}>
            <Title>Покормить без бейджа?</Title>
            <Text>
                Кормите Анонимов (без бейджа) в крайних случаях. Если вы не уверены, что перед вами Волонтер, лучше
                отправьте его в Бюро
            </Text>
        </div>
        <div className={css.bottomBLock}>
            <div className={css.buttonsBlock}>
                <Button className={css.feedMeatEater} onClick={() => doFeed(false)}>
                    🥩 Мясоеда
                </Button>
                <Button className={css.feedVegan} onClick={() => doFeed(true)}>
                    🥦 Вегана
                </Button>
                <Button variant='secondary' className={css.feedGroup} onClick={() => onClickFeedGroup()}>
                    Покормить группу
                </Button>
                <Button variant='secondary' className={css.cancel} onClick={close}>
                    Отмена
                </Button>
            </div>
            <VolAndUpdateInfo />
        </div>
    </CardContainer>
);
