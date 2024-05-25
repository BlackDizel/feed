import type { TablePaginationConfig } from '@pankod/refine-antd';
import {
    Checkbox,
    DateField,
    DatePicker,
    DeleteButton,
    Dropdown,
    EditButton,
    FilterDropdown,
    Form,
    List,
    NumberField,
    Popover,
    Radio,
    Select,
    Space,
    Table,
    TextField,
    useSelect,
    CheckboxProps,
    Icons
} from '@pankod/refine-antd';

type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

import { useList } from '@pankod/refine-core';
import type { IResourceComponentsProps } from '@pankod/refine-core';
import { ListBooleanNegative, ListBooleanPositive } from '@feed/ui/src/icons'; // TODO exclude src
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { DownloadOutlined } from '@ant-design/icons';

import styles from './list.module.css';

import type {
    AccessRoleEntity,
    ColorTypeEntity,
    CustomFieldEntity,
    DirectionEntity,
    FeedTypeEntity,
    KitchenEntity,
    VolEntity,
    VolunteerRoleEntity
} from '~/interfaces';
import { formDateFormat, isActivatedStatus, saveXLSX } from '~/shared/lib';
import { NEW_API_URL } from '~/const';
import { axios } from '~/authProvider';
import { dataProvider } from '~/dataProvider';

import useCanAccess from './use-can-access';
import { UserData, getUserData } from '~/auth';

const booleanFilters = [
    { value: true, text: 'Да' },
    { value: false, text: 'Нет' }
];

const FEED_TYPE_WITHOUT_FEED = 4;

const pagination: TablePaginationConfig = { showTotal: (total) => `Кол-во волонтеров: ${total}` };

export const isVolExpired = (vol: VolEntity, isYesterday: boolean): boolean => {
    const day = isYesterday ? dayjs().subtract(1, 'day') : dayjs();
    return vol.arrivals.every(
        ({ arrival_date, departure_date, status }) =>
            !isActivatedStatus(status) ||
            day < dayjs(arrival_date).startOf('day').add(7, 'hours') ||
            day > dayjs(departure_date).endOf('day').add(7, 'hours')
    );
};

const getCustomValue = (vol, customField) => {
    const value =
        vol.custom_field_values.find((customFieldValue) => customFieldValue.custom_field === customField.id)?.value ||
        '';
    if (customField.type === 'boolean') {
        return value === 'true';
    }
    return value;
};

const formatDate = (value) => {
    return new Date(value).toLocaleString('ru', { day: 'numeric', month: 'long' });
};

// const datePickerFilterDropDown = ({ clearFilters, confirm, selectedKeys, setSelectedKeys }: FilterDropdownProps) => (
//     <div style={{ padding: 8 }}>
//         <DatePicker
//             format={formDateFormat}
//             value={selectedKeys[0] as unknown as Dayjs}
//             onChange={(value) => setSelectedKeys(value ? [value as unknown as React.Key] : [])}
//             style={{ marginBottom: 8, display: 'block' }}
//         />
//         <Space>
//             <Button
//                 type='primary'
//                 onClick={() => confirm()}
//                 icon={<Icons.SearchOutlined />}
//                 size='small'
//                 style={{ width: 90 }}
//             >
//                 Фильтр
//             </Button>
//             <Button
//                 onClick={() => {
//                     clearFilters?.();
//                     confirm();
//                 }}
//                 size='small'
//                 style={{ width: 90 }}
//             >
//                 Очистить
//             </Button>
//         </Space>
//     </div>
// );

type FilterField = { type: string, name: string, title: string, lookup?: () => { id: unknown, name: string }[] };

type FilterItem = { name: string, op: 'include' | 'exclude', value: unknown };

type FilterListItem = { selected: boolean, value: unknown, text: string, count: number };

export const VolList: FC<IResourceComponentsProps> = () => {
    const [searchText, setSearchText] = useState('');
    const [filterUnfeededType, setfilterUnfeededType] = useState<'' | 'today' | 'yesterday'>('');
    const [feededIsLoading, setFeededIsLoading] = useState(false);
    const [feededIds, setFeededIds] = useState({});
    const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);

    const canListCustomFields = useCanAccess({ action: 'list', resource: 'volunteer-custom-fields' });
    const canFullList = useCanAccess({ action: 'full_list', resource: 'volunteers' });

    const [authorizedUserData, setAuthorizedUserData] = useState<UserData | null>(null);

    const loadAuthorizedUserData = async () => {
        const user = await getUserData(null, true);
        setAuthorizedUserData(user);
    };

    useEffect(() => {
        if(!canFullList && !authorizedUserData) {
            loadAuthorizedUserData();
        }
    }, [canFullList, authorizedUserData]);


    const { data: volunteers, isLoading: volunteersIsLoading } = useList<VolEntity>({
        resource: 'volunteers',
        config: {
            pagination: {
                pageSize: 10000
            }
        }
    });

    const { selectProps: directionsSelectProps, queryResult: directions } = useSelect<DirectionEntity>({
        resource: 'directions',
        optionLabel: 'name'
    });

    const { data: kitchens, isLoading: kitchensIsLoading } = useList<KitchenEntity>({
        resource: 'kitchens'
    });

    const { data: feedTypes, isLoading: feedTypesIsLoading } = useList<FeedTypeEntity>({
        resource: 'feed-types'
    });

    const { data: colors, isLoading: colorsIsLoading } = useList<ColorTypeEntity>({
        resource: 'colors'
    });

    const { data: accessRoles, isLoading: accessRolesIsLoading } = useList<AccessRoleEntity>({
        resource: 'access-roles'
    });

    const { data: volunteerRoles, isLoading: volunteerRolesIsLoading } = useList<VolunteerRoleEntity>({
        resource: 'volunteer-roles',
        config: {
            pagination: {
                pageSize: 10000
            }
        }
    });

    const [customFields, setCustomFields] = useState<Array<CustomFieldEntity>>([]);

    const loadCustomFields = async () => {
        const { data } = await dataProvider.getList<CustomFieldEntity>({
            resource: 'volunteer-custom-fields'
        });

        setCustomFields(data);
    };

    useEffect(() => {
        void loadCustomFields();
    }, []);

    const kitchenNameById = useMemo(() => {
        return (kitchens ? kitchens.data : []).reduce(
            (acc, kitchen) => ({
                ...acc,
                [kitchen.id]: kitchen.name
            }),
            {}
        );
    }, [kitchens]);

    const feedTypeNameById = useMemo(() => {
        return (feedTypes ? feedTypes.data : []).reduce(
            (acc, feedType) => ({
                ...acc,
                [feedType.id]: feedType.name
            }),
            {}
        );
    }, [feedTypes]);

    const colorNameById = useMemo(() => {
        return (colors ? colors.data : []).reduce(
            (acc, color) => ({
                ...acc,
                [color.id]: color.description
            }),
            {}
        );
    }, [colors]);

    const accessRoleById = useMemo(() => {
        return (accessRoles ? accessRoles.data : []).reduce(
            (acc, accessRole) => ({
                ...acc,
                [accessRole.id]: accessRole.name
            }),
            {}
        );
    }, [accessRoles]);

    const volunteerRoleById = useMemo(() => {
        return (volunteerRoles ? volunteerRoles.data : []).reduce(
            (acc, role) => ({
                ...acc,
                [role.id]: role.name
            }),
            {}
        );
    }, [accessRoles]);

    const filteredData = useMemo(() => {
        const data = volunteers?.data ?? [];
        return (
            searchText
                ? data.filter((item) => {
                      const searchTextInLowerCase = searchText.toLowerCase();
                      return [
                          item.name,
                          item.first_name,
                          item.last_name,
                          item.directions?.map(({ name }) => name).join(', '),
                          ...item.arrivals.map(({ arrival_date }) => formatDate(arrival_date))
                      ].some((text) => {
                          return text?.toLowerCase().includes(searchTextInLowerCase);
                      });
                  })
                : data
        ).filter(
            (v) =>
                canFullList || authorizedUserData && v.directions?.some(({ id }) => authorizedUserData.directions?.includes(id))
        ).filter(
            (v) =>
                !filterUnfeededType ||
                (!feededIds[v.id] &&
                    !v.is_blocked &&
                    !isVolExpired(v, filterUnfeededType === 'yesterday') &&
                    v.feed_type !== FEED_TYPE_WITHOUT_FEED)
        ).filter(vol => {
            return activeFilters.every((filter) => {
                const value = vol[filter.name];
                if(Array.isArray(filter.value)) {
                    return filter.value.some(currentValue => currentValue == value);
                } else if(typeof filter.value === 'string' && typeof value === 'string') {
                    return value.includes(filter.value);
                } else {
                    return filter.value === value;
                }
            })
        });
    }, [volunteers, searchText, feededIds, filterUnfeededType, canFullList, authorizedUserData, activeFilters]);

    // const { selectProps } = useSelect<VolEntity>({
    //     resource: 'volunteers'
    // });

    // return <Loader />;

    const getSorter = (field: string) => {
        return (a, b) => {
            const x = a[field] ?? '';
            const y = b[field] ?? '';

            if (x < y) {
                return -1;
            }
            if (x > y) {
                return 1;
            }
            return 0;
        };
    };

    const onDirectionFilter = (value, data) => {
        return data.directions.some((d) => d.id === value);
    };

    const onBlockedFilter = (value, data) => {
        return data.is_blocked === value;
    };

    const createAndSaveXLSX = useCallback(() => {
        if (filteredData) {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Volunteers');

            const header = [
                'ID',
                'Позывной',
                'Имя',
                'Фамилия',
                'Службы/Локации',
                'Роль',
                'Статус текущего завезда',
                'Текущий заезд от',
                'Текущий заезд до',
                'Статус будущего завезда',
                'Будущий заезд от',
                'Будущий заезд до',
                'Заблокирован',
                'Кухня',
                'Партия бейджа',
                'Тип питания',
                'Веган/мясоед',
                'Комментарий',
                'Цвет бейджа',
                'Право доступа',
                ...customFields?.map((field) => field.name)
            ];
            sheet.addRow(header);

            filteredData.forEach((vol, index) => {
                const currentArrival = vol.arrivals.find(
                    ({ arrival_date, departure_date }) =>
                        dayjs(arrival_date) < dayjs() && dayjs(departure_date) > dayjs().subtract(1, 'day')
                );
                const futureArrival = vol.arrivals.find(({ arrival_date }) => dayjs(arrival_date) > dayjs());
                sheet.addRow([
                    vol.id,
                    vol.name,
                    vol.first_name,
                    vol.last_name,
                    vol.directions ? vol.directions.map((direction) => direction.name).join(', ') : '',
                    vol.main_role ? volunteerRoleById[vol.main_role] : '',
                    currentArrival?.status || '',
                    currentArrival ? dayjs(currentArrival.arrival_date).format(formDateFormat) : '',
                    currentArrival ? dayjs(currentArrival.departure_date).format(formDateFormat) : '',
                    futureArrival?.status || '',
                    futureArrival ? dayjs(futureArrival.arrival_date).format(formDateFormat) : '',
                    futureArrival ? dayjs(futureArrival.departure_date).format(formDateFormat) : '',
                    vol.is_blocked ? 1 : 0,
                    vol.kitchen ? kitchenNameById[vol.kitchen] : '',
                    vol.printing_batch,
                    vol.feed_type ? feedTypeNameById[vol.feed_type] : '',
                    vol.is_vegan ? 'веган' : 'мясоед',
                    vol.comment ? vol.comment.replace(/<[^>]*>/g, '') : '',
                    vol.color_type ? colorNameById[vol.color_type] : '',
                    vol.access_role ? accessRoleById[vol.access_role] : '',
                    ...customFields?.map((field) => {
                        const value =
                            vol.custom_field_values.find((fieldValue) => fieldValue.custom_field === field.id)?.value ||
                            '';
                        if (field.type === 'boolean') {
                            return value === 'true' ? 1 : 0;
                        }
                        return value;
                    })
                ]);
            });
            void saveXLSX(workbook, 'volunteers');
        }
    }, [feedTypeNameById, filteredData, kitchenNameById]);

    const handleClickDownload = useCallback((): void => {
        void createAndSaveXLSX();
    }, [createAndSaveXLSX]);

    const handleClickCustomFields = useCallback((): void => {
        window.location.href = `${window.location.origin}/volunteer-custom-fields`;
    }, []);

    const loadTransactions = async () => {
        const newFeededIds = {};
        if (filterUnfeededType) {
            const today = dayjs().startOf('day');
            const from = filterUnfeededType === 'yesterday' ? today.subtract(1, 'day') : today;
            const url = `${NEW_API_URL}/feed-transaction/?limit=100000&dtime_from=${from.toISOString()}&dtime_to=${from
                .add(1, 'day')
                .toISOString()}`;

            try {
                setFeededIsLoading(true);
                const {
                    data: { results }
                } = await axios.get(url);
                results.forEach(({ volunteer }) => {
                    newFeededIds[volunteer] = true;
                });
            } finally {
                setFeededIsLoading(false);
            }
        }
        setFeededIds(newFeededIds);
    };

    useEffect(() => {
        void loadTransactions();
    }, [filterUnfeededType]);

    const getOnField = (vol: VolEntity) => {
        const day = dayjs();
        return vol.arrivals.some(
            ({ arrival_date, departure_date, status }) =>
                isActivatedStatus(status) &&
                day >= dayjs(arrival_date).startOf('day').add(7, 'hours') &&
                day <= dayjs(departure_date).endOf('day').add(7, 'hours')
        );
    };
    const getFilterValueText = (field: FilterField, value: unknown): string => {
        if(value === true) {
            return 'Да';
        }
        if(value === false) {
            return 'Нет';
        }
        if(field.lookup) {
            return field.lookup().find(({ id }) => id === value)?.name ?? '';
        }
        return String(value);
    }

    const getFilterListItems = (field: FilterField, filterItem?: FilterItem): FilterListItem[] => {
        const lookupItems = field.lookup?.();

        if(lookupItems) {
            return lookupItems.map(item => ({
                value: item.id,
                text: item.name,
                selected: filterItem ? filterItem.value.includes(item.id) : false,
                count: 0
            }));
        }

        if(field.type === 'boolean') {
            return [true, false].map(value => ({
                value,
                text: getFilterValueText(field, value),
                selected: filterItem ? filterItem.value.includes(value) : false,
                count: 0
            }));
        } else {
            const valueCounts = (volunteers?.data ?? []).reduce((acc: { [key: string]: number }, vol) => {
                acc[vol[field.name]] = (acc[vol[field.name]] ?? 0) + 1;
                return acc;
            }, {});
            const values = Object.keys(valueCounts).sort();
    
            return values.map(value => ({
                value,
                text: getFilterValueText(field, value),
                selected: filterItem ? filterItem.value.includes(value) : false,
                count: valueCounts[value] ?? 0
            }));
        }
    }

    const onFilterValueChange = (field: FilterField, filterListItem: FilterListItem) => {
        const filterItem = activeFilters.find(f => f.name === field.name);

        if(filterListItem.selected) {
            if(filterItem && Array.isArray(filterItem.value)) {
                const newValues = filterItem.value.filter( value => value !== filterListItem.value);
                const newFilters = activeFilters.filter(f => f.name !== field.name).concat(newValues.length ? [
                    {
                        ...filterItem,
                        value: newValues
                    }
                ] : []);

                setActiveFilters(newFilters);
            }
        } else {
            if(filterItem && Array.isArray(filterItem.value)) {
                const newValues = [...filterItem.value, filterListItem.value];
                const newFilters = activeFilters.filter(f => f.name !== field.name).concat([
                    {
                        ...filterItem,
                        value: newValues
                    }
                ]);

                setActiveFilters(newFilters);
            } else {
                const newFilters = activeFilters.concat([
                    {
                        name: field.name,
                        op: 'include',
                        value: [filterListItem.value]
                    }
                ]);

                setActiveFilters(newFilters);
            }
        }
        // return (e: ArgumentTypes<Required<CheckboxProps>['onChange']>[0]) => {
            
        // }
    }

    const onFilterTextValueChange = (field: FilterField, value: unknown) => {
        const filterItem = activeFilters.find(f => f.name === field.name);

        if(!value) {
            const newFilters = activeFilters.filter(f => f.name !== field.name);
            setActiveFilters(newFilters);
        } else  if(filterItem) {
            const newFilters = activeFilters.filter(f => f.name !== field.name).concat([
                {
                    ...filterItem,
                    value,
                }
            ]);

            setActiveFilters(newFilters);
        } else {
            const newFilters = activeFilters.concat([
                {
                    name: field.name,
                    op: 'include',
                    value
                }
            ]);

            setActiveFilters(newFilters);
        }
    }

    const createRenderFilterPopupContent = (field: FilterField) => {
        const operations = [
            {
              label: 'включает',
              key: 'include',
            },
            {
              label: 'не включает',
              key: 'exclude',
            }
          ];

        const filterItem = activeFilters.find(f => f.name === field.name);
        const currentOperation = filterItem?.op === 'exclude' ?  operations[1] : operations[0];
        const filterListItems = getFilterListItems(field, filterItem);

        return () => {
            return <div>
                <div className={styles.filterPopupHeader}>
                    <span className={styles.filterPopupFieldName}>
                        {field.title}
                    </span>&nbsp;
                    <Dropdown menu={{ items: operations }}>
                        <a><span>{currentOperation.label}&nbsp;<Icons.DownOutlined /></span></a>
                    </Dropdown>
                </div>
                {field.type === 'string' && <Input value={filterItem?.value as string} onChange={(e) => onFilterTextValueChange(field,  e.target.value)} placeholder='Введите текст' allowClear />}
                {field.type !== 'string' && <div className={styles.filterPopupList}>
                    {filterListItems.map(filterListItem => {
                        return <div className={styles.filterPopupListItem}>
                            <Checkbox value={filterListItem.selected} onChange={() => onFilterValueChange(field, filterListItem)} />
                            {filterListItem.text}{filterListItem.count > 0 && <span className={styles.filterListItemCount}>({filterListItem.count})</span>}
                        </div>
                    })}
                </div>}
            </div>
        }
    }

    const renderFilterItemText = (field: FilterField) => {
        const filterItem = activeFilters.find(f => f.name == field.name);

        if(filterItem) {
            return  <span className={styles.filterItemActive}>
                <span className={styles.filterItemNameActive}>{field.title}:</span>
                &nbsp;
                <span>{(Array.isArray(filterItem.value) ? filterItem.value : [filterItem.value]).map(value => getFilterValueText(field, value)).join(', ')}</span>
            </span>;
        }
        return <span>{field.title}</span>;
    }

    const fields: FilterField[] = [
        // { type: 'string', name: 'id', title: 'ID' },
        { type: 'string', name: 'name', title: 'Имя на бейдже' },
        { type: 'string', name: 'first_name', title: 'Имя', },
        { type: 'string', name: 'last_name', title: 'Фамилия', },
        { type: 'lookup', name: 'directions', title: 'Службы/Локации', lookup: () => directions.data?.data ?? [] }, // directions
        { type: 'lookup', name: 'main_role', title: 'Роль', lookup: () => volunteerRoles?.data ?? [] },
        // { type: 'date', name: 'active_to', title: 'На поле' },
        // { type: 'date', name: 'active_to', title: 'Статус заезда' },
        // { type: 'date', name: 'active_from', title: 'Дата заезда' },
        // { type: 'date', name: 'active_to', title: 'Дата отъезда' },
        // { type: 'date', name: 'active_to', title: 'Транспорт заезда' },
        // { type: 'date', name: 'active_to', title: 'Транспорт отъезда' },
        { type: 'boolean', name: 'is_blocked', title: 'Заблокирован' },
        { type: 'lookup', name: 'kitchen', title: 'Кухня', lookup: () => kitchens?.data ?? [] }, // kitchenNameById
        { type: 'string', name: 'printing_batch', title: 'Партия бейджа' },
        { type: 'lookup', name: 'feed_type', title: 'Тип питания', lookup: () => feedTypes?.data ?? [] }, // feedTypeNameById
        { type: 'boolean', name: 'is_vegan', title: 'Веган' },
        { type: 'string', name: 'comment', title: 'Комментарий' },
        { type: 'lookup', name: 'color_type', title: 'Цвет бейджа', lookup: () => colors?.data.map(({ id, description: name }) => ({ id, name })) ?? [] }, // colorNameById
        { type: 'lookup', name: 'access_role', title: 'Право доступа', lookup: () => accessRoles?.data ?? [] }, // accessRoleById
    ];

    return (
        <List>
            <Input placeholder='Поиск...' value={searchText} onChange={(e) => setSearchText(e.target.value)}></Input>
            <div className={styles.filters}>
                <div className={styles.filtersLabel}>Фильтры:</div>
                <div className={styles.filterItems}>{fields.map(field => {
                    return <Popover placement="bottomLeft" content={createRenderFilterPopupContent(field)} overlayInnerStyle={{ borderRadius: 0 }} trigger="click">
                        <Button className={styles.filterItemButton}>
                            {renderFilterItemText(field)}
                            <span className={styles.filterDownIcon}><Icons.DownOutlined /></span>
                        </Button> 
                  </Popover>;
                })}</div>
            </div>
            <Form layout='inline' style={{ padding: '10px 0' }}>
                <Form.Item>
                    <Button
                        type={'primary'}
                        onClick={handleClickDownload}
                        icon={<DownloadOutlined />}
                        disabled={
                            !filteredData &&
                            kitchensIsLoading &&
                            feedTypesIsLoading &&
                            colorsIsLoading &&
                            accessRolesIsLoading &&
                            volunteerRolesIsLoading
                        }
                    >
                        Выгрузить
                    </Button>
                </Form.Item>
                <Form.Item>
                    <Radio.Group value={filterUnfeededType} onChange={(e) => setfilterUnfeededType(e.target.value)}>
                        <Radio.Button value=''>Все</Radio.Button>
                        <Radio.Button value='today'>Не питавшиеся сегодня</Radio.Button>
                        <Radio.Button value='yesterday'>Не питавшиеся вчера</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item>
                    <Button disabled={!canListCustomFields} onClick={handleClickCustomFields}>
                        Кастомные поля
                    </Button>
                </Form.Item>
            </Form>
            <Table
                scroll={{ x: '100%' }}
                pagination={pagination}
                loading={volunteersIsLoading || feededIsLoading}
                dataSource={filteredData}
                rowKey='id'
            >
                <Table.Column<VolEntity>
                    title=''
                    dataIndex='actions'
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size='small' recordItemId={record.id} />
                            <DeleteButton hideText size='small' recordItemId={record.id} />
                        </Space>
                    )}
                />
                <Table.Column
                    dataIndex='id'
                    key='id'
                    title='ID'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('id')}
                />
                <Table.Column
                    dataIndex='name'
                    key='name'
                    title='Имя на бейдже'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('name')}
                />
                <Table.Column
                    dataIndex='first_name'
                    key='first_name'
                    title='Имя'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('first_name')}
                />
                <Table.Column
                    dataIndex='last_name'
                    key='last_name'
                    title='Фамилия'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('last_name')}
                />
                <Table.Column
                    dataIndex='directions'
                    key='directions'
                    title='Службы / Локации'
                    render={(value) => <TextField value={value.map(({ name }) => name).join(', ')} />}
                    filterDropdown={(props) => (
                        <FilterDropdown {...props}>
                            <Select
                                style={{ minWidth: 300 }}
                                mode='multiple'
                                placeholder='Служба / Локация'
                                {...directionsSelectProps}
                            />
                        </FilterDropdown>
                    )}
                    onFilter={onDirectionFilter}
                />
                <Table.Column
                    dataIndex='arrivals'
                    key='arrivals'
                    title='Даты на поле'
                    render={(arrivals) => (
                        <span style={{ whiteSpace: 'nowrap' }}>
                            {arrivals
                                .map(({ arrival_date, departure_date }) =>
                                    [arrival_date, departure_date].map(formatDate).join(' - ')
                                )
                                .join(', ')}
                        </span>
                    )}
                />
                <Table.Column
                    key='on_field'
                    title='На поле'
                    filters={booleanFilters}
                    onFilter={(value, vol) => {
                        const currentValue = getOnField(vol as VolEntity);
                        return value === currentValue;
                    }}
                    render={(vol) => {
                        const value = getOnField(vol as VolEntity);
                        return <ListBooleanPositive value={value} />;
                    }}
                />
                <Table.Column
                    dataIndex='is_blocked'
                    key='is_blocked'
                    title='❌'
                    render={(value) => <ListBooleanNegative value={value} />}
                    sorter={getSorter('is_blocked')}
                    filters={booleanFilters}
                    onFilter={onBlockedFilter}
                />
                <Table.Column
                    dataIndex='kitchen'
                    key='kitchen'
                    title='Кухня'
                    render={(value) => <TextField value={value} />}
                    sorter={getSorter('kitchen')}
                />
                <Table.Column
                    dataIndex='printing_batch'
                    key='printing_batch'
                    title={
                        <span>
                            Партия
                            <br />
                            Бейджа
                        </span>
                    }
                    render={(value) => value && <NumberField value={value} />}
                />

                <Table.Column
                    dataIndex='comment'
                    key='comment'
                    title='Комментарий'
                    render={(value) => <div dangerouslySetInnerHTML={{ __html: value }} />}
                />

                {customFields?.map((customField) => {
                    const filterValues = volunteers
                        ? Object.keys(
                              volunteers.data.reduce((acc, vol) => {
                                  const value = getCustomValue(vol, customField);
                                  acc[value] = true;
                                  return acc;
                              }, {})
                          )
                        : [];

                    const filters =
                        customField.type === 'boolean'
                            ? booleanFilters
                            : filterValues.map((value) => ({ value, text: value || '(пустое значение)' }));

                    return (
                        <Table.Column
                            key={customField.name}
                            title={customField.name}
                            filters={filters}
                            onFilter={(value, vol) => {
                                const currentValue = getCustomValue(vol, customField);
                                return value === currentValue;
                            }}
                            render={(vol) => {
                                const value = getCustomValue(vol, customField);
                                if (customField.type === 'boolean') {
                                    return <ListBooleanPositive value={value} />;
                                }
                                return value;
                            }}
                        />
                    );
                })}
            </Table>
        </List>
    );
};
