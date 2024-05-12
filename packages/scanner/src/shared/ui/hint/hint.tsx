import { memo, useState } from 'react';
import cn from 'classnames';

import { Text } from '~/shared/ui/typography';
import { CircleQuestion } from '~/shared/ui/icons/circle-question';

import css from './hint.module.css';

interface HintProps {
    children?: React.ReactNode;
    styleBox?: string;
    styleIcon?: string;
}

const Hint = memo(function Hint({ children, styleBox = '', styleIcon = '' }: HintProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            {isOpen && <div className={css.backdrop} onClick={() => setIsOpen(false)}></div>}
            <div className={css.hint}>
                <button className={css.iconButton} onClick={() => setIsOpen((prev) => !prev)}>
                    <CircleQuestion />
                </button>
                {isOpen && (
                    <>
                        <div className={cn(css.hintIcon, { [styleIcon]: !!styleIcon })}></div>
                        <div className={cn(css.hintBox, { [styleBox]: !!styleBox })}>{children}</div>
                    </>
                )}
            </div>
        </>
    );
});

export default Hint;
