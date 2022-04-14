import React, {createContext} from "react";
import {ObserverValue, useObserver, useObserverListener, useObserverValue} from "../observer";
import Vertical from "../layout/Vertical";
import {Grid} from "../grid/Grid";
import Horizontal from "../layout/Horizontal";
import {Observer} from "../observer/useObserver";

const DimensionSelectorContext = createContext<any>({});

interface DimensionSelectorProps {
    $displayDimensionSelector: Observer<boolean>;
    onDimensionChanged: (props: { columns: Array<any>, rows: Array<any>, filters: Array<any>, values: Array<any> }) => void,
    initialDimension: { filters: any; columns: any; rows: any; values: any; dimensions: any }
}

export function DimensionSelector(dimensionSelectorProps: DimensionSelectorProps) {
    const localStorage = window.localStorage;
    const display = useObserverValue(dimensionSelectorProps.$displayDimensionSelector);

    const [$fieldsGridData, setFieldsGridData] = useObserver<any>(dimensionSelectorProps.initialDimension.dimensions);
    const [$filtersGridData, setFiltersGridData] = useObserver<any>(dimensionSelectorProps.initialDimension.filters);
    const [$columnsGridData, setColumnsGridData] = useObserver<any>(dimensionSelectorProps.initialDimension.columns);
    const [$rowsGridData, setRowsGridData] = useObserver<any>(dimensionSelectorProps.initialDimension.rows);
    const [$valuesGridData, setValuesGridData] = useObserver<any>(dimensionSelectorProps.initialDimension.values);

    useObserverListener([$filtersGridData], () => {
        localStorage.setItem('filters', JSON.stringify($filtersGridData.current));
    });
    useObserverListener([$columnsGridData], () => {
        localStorage.setItem('columns', JSON.stringify($columnsGridData.current));
    });
    useObserverListener([$rowsGridData], () => {
        localStorage.setItem('rows', JSON.stringify($rowsGridData.current));
    });
    useObserverListener([$valuesGridData], () => {
        localStorage.setItem('values', JSON.stringify($valuesGridData.current));
    });

    const [$focusedItem, setFocusedItem] = useObserver<any>(undefined);
    const [$toolBarAction, setToolBarAction] = useObserver<any>([]);
    useObserverListener([$focusedItem, $fieldsGridData, $filtersGridData, $rowsGridData, $columnsGridData, $valuesGridData], () => {

        const isInFields = $fieldsGridData.current.indexOf($focusedItem.current) >= 0;
        const isInFilters = $filtersGridData.current.indexOf($focusedItem.current) >= 0;
        const isInRows = $rowsGridData.current.indexOf($focusedItem.current) >= 0;
        const isInColumns = $columnsGridData.current.indexOf($focusedItem.current) >= 0;
        const isInValues = $valuesGridData.current.indexOf($focusedItem.current) >= 0;
        const isNumber = $focusedItem.current.isNumber;

        function moveFrom(props: { fromGridSetter: (value: any) => void, toGridSetter: (value: any) => void }) {
            return () => {
                props.fromGridSetter((old: any) => old.filter((i: any) => i !== $focusedItem.current));
                props.toGridSetter((old: any) => [...old, $focusedItem.current]);
                if (dimensionSelectorProps.onDimensionChanged) {
                    dimensionSelectorProps.onDimensionChanged({
                        columns: $columnsGridData.current,
                        rows: $rowsGridData.current,
                        filters: $filtersGridData.current,
                        values: $valuesGridData.current
                    });
                }
            }
        }

        function moveUpOrDown(setState: any, isUp: boolean) {
            return () => {
                setState((old: Array<any>) => {
                    const currentIndex = old.indexOf($focusedItem.current);
                    if (isUp && currentIndex > 0) {
                        const itemBefore = old[currentIndex - 1];
                        old[currentIndex - 1] = $focusedItem.current;
                        old[currentIndex] = itemBefore;
                        return [...old];
                    }
                    if (!isUp && (currentIndex < old.length)) {
                        const itemAfter = old[currentIndex + 1];
                        old[currentIndex + 1] = $focusedItem.current;
                        old[currentIndex] = itemAfter;
                        return [...old];
                    }
                    return old;
                });
                if (dimensionSelectorProps.onDimensionChanged) {
                    dimensionSelectorProps.onDimensionChanged({
                        columns: $columnsGridData.current,
                        rows: $rowsGridData.current,
                        filters: $filtersGridData.current,
                        values: $valuesGridData.current
                    });
                }
            }
        }


        const fieldsGridAction = [
            {
                title: 'Add to Rows',
                onAction: moveFrom({fromGridSetter: setFieldsGridData, toGridSetter: setRowsGridData})
            },
            {
                title: 'Add to Columns',
                onAction: moveFrom({fromGridSetter: setFieldsGridData, toGridSetter: setColumnsGridData})
            },
            {
                title: 'Add to Filters',
                onAction: moveFrom({fromGridSetter: setFieldsGridData, toGridSetter: setFiltersGridData})
            },
            {
                title: 'Move Up',
                onAction: moveUpOrDown(setFieldsGridData, true)
            },
            {
                title: 'Move Down',
                onAction: moveUpOrDown(setFieldsGridData, false)
            }
        ];

        const fieldsGridActionForNumberItem = [
            {
                title: 'Add to Values',
                onAction: moveFrom({fromGridSetter: setFieldsGridData, toGridSetter: setValuesGridData})
            },
            {
                title: 'Move Up',
                onAction: moveUpOrDown(setFieldsGridData, true)
            },
            {
                title: 'Move Down',
                onAction: moveUpOrDown(setFieldsGridData, false)
            }
        ];

        const valuesGridActionForNumberItem = [
            {
                title: 'Remove from Values',
                onAction: moveFrom({fromGridSetter: setValuesGridData, toGridSetter: setFieldsGridData})
            },
            {
                title: 'Move Up',
                onAction: moveUpOrDown(setValuesGridData, true)
            },
            {
                title: 'Move Down',
                onAction: moveUpOrDown(setValuesGridData, false)
            }
        ];

        const filtersGridAction = [
            {
                title: 'Move to Rows',
                onAction: moveFrom({fromGridSetter: setFiltersGridData, toGridSetter: setRowsGridData})
            },
            {
                title: 'Move to Columns',
                onAction: moveFrom({fromGridSetter: setFiltersGridData, toGridSetter: setColumnsGridData})
            },
            {
                title: 'Remove Filters',
                onAction: moveFrom({fromGridSetter: setFiltersGridData, toGridSetter: setFieldsGridData})
            },
            {
                title: 'Move Up',
                onAction: moveUpOrDown(setFiltersGridData, true)
            },
            {
                title: 'Move Down',
                onAction: moveUpOrDown(setFiltersGridData, false)
            }
        ];
        const columnGridAction = [
            {
                title: 'Move to Rows',
                onAction: moveFrom({fromGridSetter: setColumnsGridData, toGridSetter: setRowsGridData})
            },
            {
                title: 'Remove Column',
                onAction: moveFrom({fromGridSetter: setColumnsGridData, toGridSetter: setFieldsGridData})
            },
            {
                title: 'Move to Filters',
                onAction: moveFrom({fromGridSetter: setColumnsGridData, toGridSetter: setFiltersGridData})
            },
            {
                title: 'Move Up',
                onAction: moveUpOrDown(setColumnsGridData, true)
            },
            {
                title: 'Move Down',
                onAction: moveUpOrDown(setColumnsGridData, false)
            }
        ];
        const rowGridAction = [
            {
                title: 'Remove Row',
                onAction: moveFrom({fromGridSetter: setRowsGridData, toGridSetter: setFieldsGridData})
            },
            {
                title: 'Move to Columns',
                onAction: moveFrom({fromGridSetter: setRowsGridData, toGridSetter: setColumnsGridData})
            },
            {
                title: 'Move to Filters',
                onAction: moveFrom({fromGridSetter: setRowsGridData, toGridSetter: setFiltersGridData})
            },
            {
                title: 'Move Up',
                onAction: moveUpOrDown(setRowsGridData, true)
            },
            {
                title: 'Move Down',
                onAction: moveUpOrDown(setRowsGridData, false)
            }
        ];


        if (isNumber) {
            if (isInFields) {
                setToolBarAction(fieldsGridActionForNumberItem);
            }
            if (isInValues) {
                setToolBarAction(valuesGridActionForNumberItem);
            }
            return;
        }

        if (isInFields) {
            setToolBarAction(fieldsGridAction);
        }
        if (isInColumns) {
            setToolBarAction(columnGridAction);
        }
        if (isInFilters) {
            setToolBarAction(filtersGridAction);
        }
        if (isInRows) {
            setToolBarAction(rowGridAction);
        }

    });


    return <DimensionSelectorContext.Provider value={{}}><Vertical
        onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
        }}
        style={{
            bottom: display ? 0 : '-80%',
            height: '80%',
            position: 'absolute',
            width: '100%',
            transition: 'bottom 300ms ease-in-out',
            overflow: 'auto',
            backgroundColor: '#ddd',
            padding: '0.5rem',
            zIndex: 99
        }}>

        <Vertical style={{height: '33.33%'}}>
            <ObserverValue observers={[$fieldsGridData, $focusedItem]} render={() => {
                return <Grid defaultRowHeight={40} columns={[
                    {title: 'Choose fields to add to report', field: 'name', width: '100%'}
                ]} data={$fieldsGridData.current} rowResizerHidden={true}
                             defaultHeaderRowHeight={30}

                             focusedDataItem={$focusedItem.current}
                             filterHidden={true}
                             onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}

                />
            }}/>
        </Vertical>
        <Horizontal style={{height: '33.33%', overflow: 'auto', marginTop: '0.5rem'}}>
            <Vertical style={{width: '50%', borderRight: '1px solid #CCC'}}>
                <ObserverValue observers={[$filtersGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Filters', field: 'name', width: '100%'}
                    ]} data={$filtersGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
            <Vertical style={{width: '50%', marginLeft: '0.5rem'}}>
                <ObserverValue observers={[$columnsGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Columns', field: 'name', width: '100%'}
                    ]} data={$columnsGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
        </Horizontal>
        <Horizontal style={{height: '33.33%', overflow: 'auto', marginTop: '0.5rem'}}>
            <Vertical style={{width: '50%', borderRight: '1px solid #CCC'}}>
                <ObserverValue observers={[$rowsGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Rows', field: 'name', width: '100%'}
                    ]} data={$rowsGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
            <Vertical style={{width: '50%', marginLeft: '0.5rem'}}>
                <ObserverValue observers={[$valuesGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Values', field: 'name', width: '100%'}
                    ]} data={$valuesGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
        </Horizontal>
        <ObserverValue observers={$toolBarAction} render={() => {
            const toolBarActions = $toolBarAction.current;
            const width = Math.round((100 / toolBarActions.length));
            return <Horizontal style={{borderTop: '1px solid #CCC', marginTop: '0.5rem'}}>
                {toolBarActions.map((ta: any) => {
                    return <Vertical hAlign={'center'} style={{
                        width: `${width}%`,
                        padding: '1rem',
                        backgroundColor: '#fff',
                        borderRight: '1px solid #ccc'
                    }} key={ta.title} onClick={() => ta.onAction()}>
                        {ta.title}
                    </Vertical>
                })}
            </Horizontal>
        }}/>
    </Vertical>
    </DimensionSelectorContext.Provider>

}