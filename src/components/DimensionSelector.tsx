import React, {createContext, useContext, useMemo} from "react";
import {ObserverValue, useObserver, useObserverListener, useObserverValue} from "../observer";
import Vertical from "../layout/Vertical";
import {Grid} from "../grid/Grid";
import Horizontal from "../layout/Horizontal";
import {Observer} from "../observer/useObserver";
import {CellComponentStyledProps} from "../grid/Sheet";
import {IoFilterOutline} from "react-icons/io5";
import FilterSelector from "./FilterSelector";
import {Dimension} from "../App";

const DimensionSelectorContext = createContext<any>({});

interface DimensionSelectorProps {
    $displayDimensionSelector: Observer<boolean>;
    onDimensionChanged: (props: { columns: Array<Dimension>, rows: Array<Dimension>, filters: Array<Dimension>, values: Array<Dimension> }) => void,
    initialDimension: { filters: Array<Dimension>; columns: Array<Dimension>; rows: Array<Dimension>; values: Array<Dimension>; dimensions: Array<Dimension> };
}

function ItemCellComponent(props: CellComponentStyledProps) {
    const dimensionContext = useContext(DimensionSelectorContext);
    return <Horizontal style={{...props.cellStyle, paddingRight: 0}} vAlign={'center'}>
        <Vertical style={{flexGrow: 1}}>
            {props.value}
        </Vertical>
        <Vertical style={{fontSize: 26, padding: '0px 10px', borderLeft: '1px solid #ddd'}}
                  onClick={() => dimensionContext.onFilterClicked(props.dataItem)}>
            <IoFilterOutline/>
        </Vertical>
    </Horizontal>
}

function setupAction(props: {
                         $fieldsGridData: Observer<any>,
                         $focusedItem: Observer<any>,
                         $filtersGridData: Observer<any>,
                         $rowsGridData: Observer<any>,
                         $columnsGridData: Observer<any>,
                         $valuesGridData: Observer<any>,
                         dimensionSelectorProps: DimensionSelectorProps,
                         setFieldsGridData: (value: any) => void,
                         setRowsGridData: (value: any) => void,
                         setColumnsGridData: (value: any) => void,
                         setFiltersGridData: (value: any) => void,
                         setValuesGridData: (value: any) => void,
                         setToolBarAction: (value: any) => void
                     }
) {
    return () => {
        const {
            dimensionSelectorProps,
            $columnsGridData,
            $rowsGridData,
            $valuesGridData,
            $filtersGridData,
            setFieldsGridData,
            setToolBarAction,
            setFiltersGridData,
            setRowsGridData,
            setValuesGridData,
            setColumnsGridData,
            $fieldsGridData,
            $focusedItem
        } = props;

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

    };
}

export function DimensionSelector(dimensionSelectorProps: DimensionSelectorProps) {
    const localStorage = window.localStorage;
    const display = useObserverValue(dimensionSelectorProps.$displayDimensionSelector);

    const [$fieldsGridData, setFieldsGridData] = useObserver<Array<Dimension>>(dimensionSelectorProps.initialDimension.dimensions);
    const [$filtersGridData, setFiltersGridData] = useObserver<Array<Dimension>>(dimensionSelectorProps.initialDimension.filters);
    const [$columnsGridData, setColumnsGridData] = useObserver<Array<Dimension>>(dimensionSelectorProps.initialDimension.columns);
    const [$rowsGridData, setRowsGridData] = useObserver<Array<Dimension>>(dimensionSelectorProps.initialDimension.rows);
    const [$valuesGridData, setValuesGridData] = useObserver<Array<Dimension>>(dimensionSelectorProps.initialDimension.values);

    const [$displayFilterSelector,setDisplayFilterSelector] = useObserver<boolean>(false);

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
    const [$focusedItem, setFocusedItem] = useObserver<Dimension>({id:'',allSelected:false,filteredItems:[],name:''});
    const [$toolBarAction, setToolBarAction] = useObserver<any>([]);
    useObserverListener([$focusedItem, $fieldsGridData, $filtersGridData, $rowsGridData, $columnsGridData, $valuesGridData], setupAction({
        $fieldsGridData,
        $focusedItem,
        $filtersGridData,
        $rowsGridData,
        $columnsGridData,
        $valuesGridData,
        dimensionSelectorProps,
        setFieldsGridData,
        setRowsGridData,
        setColumnsGridData,
        setFiltersGridData,
        setValuesGridData,
        setToolBarAction
    }));

    const contextProviderValue = useMemo(() => {
        function onFilterClicked(){
            setDisplayFilterSelector(true);
        }
        return {
            onFilterClicked
        }
    },[setDisplayFilterSelector]);
    return <DimensionSelectorContext.Provider value={contextProviderValue}><Vertical
        onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
        }}
        style={{
            bottom: display ? 0 : '-85%',
            height: '80%',
            position: 'absolute',
            width: '100%',
            transition: 'bottom 300ms ease-in-out',
            backgroundColor: '#fff',
            padding: '0rem',
            zIndex: 99,
            boxShadow: '0px 0px 20px -2px #666'
        }}>

        <Vertical style={{height: '33.33%'}}>
            <ObserverValue observers={[$fieldsGridData, $focusedItem]} render={() => {
                return <Grid defaultRowHeight={40} columns={[
                    {title: 'Choose fields to add to report', field: 'name',hAlign:'left', width: '100%'}
                ]} data={$fieldsGridData.current} rowResizerHidden={true}
                             defaultHeaderRowHeight={30}
                             focusedDataItem={$focusedItem.current}
                             filterHidden={true}
                             onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                />
            }}/>
        </Vertical>
        <Horizontal style={{height: '33.33%', overflow: 'auto',borderTop:'1px solid #999'}}>
            <Vertical style={{width: '50%', borderRight: '1px solid #CCC'}}>
                <ObserverValue observers={[$filtersGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Filters', field: 'name', width: '100%',hAlign:'left', cellComponent: ItemCellComponent}
                    ]} data={$filtersGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
            <Vertical style={{width: '50%'}}>
                <ObserverValue observers={[$columnsGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Columns', field: 'name', width: '100%',hAlign:'left', cellComponent: ItemCellComponent}
                    ]} data={$columnsGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
        </Horizontal>
        <Horizontal style={{height: '33.33%', overflow: 'auto',borderTop:'1px solid #999'}}>
            <Vertical style={{width: '50%', borderRight: '1px solid #CCC'}}>
                <ObserverValue observers={[$rowsGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Rows', field: 'name', width: '100%',hAlign:'left', cellComponent: ItemCellComponent}
                    ]} data={$rowsGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
            <Vertical style={{width: '50%'}}>
                <ObserverValue observers={[$valuesGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={40} columns={[
                        {title: 'Values', field: 'name', width: '100%',hAlign:'left'}
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
            return <Horizontal style={{borderTop: '1px solid #CCC'}}>
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
        <FilterSelector $displayFilterSelector={$displayFilterSelector}
                        setDisplayFilterSelector={setDisplayFilterSelector}
                        $selectedItem={$focusedItem}
                        onSelectedItemChanged={(selectedItem) => {

                            const isInFilters = $filtersGridData.current.indexOf($focusedItem.current) >= 0;
                            const isInRows = $rowsGridData.current.indexOf($focusedItem.current) >= 0;
                            const isInColumns = $columnsGridData.current.indexOf($focusedItem.current) >= 0;
                            if(isInFilters){
                                setFiltersGridData(oldData => {
                                   const currentIndex = oldData.indexOf($focusedItem.current);
                                   oldData[currentIndex] = selectedItem;
                                   return [...oldData];
                                });
                            }
                            if(isInRows){
                                setRowsGridData(oldData => {
                                    const currentIndex = oldData.indexOf($focusedItem.current);
                                    oldData[currentIndex] = selectedItem;
                                    return [...oldData];
                                });
                            }
                            if(isInColumns){
                                setColumnsGridData(oldData => {
                                    const currentIndex = oldData.indexOf($focusedItem.current);
                                    oldData[currentIndex] = selectedItem;
                                    return [...oldData];
                                });
                            }
                            setFocusedItem(selectedItem);
                            if (dimensionSelectorProps.onDimensionChanged) {
                                dimensionSelectorProps.onDimensionChanged({
                                    columns: $columnsGridData.current,
                                    rows: $rowsGridData.current,
                                    filters: $filtersGridData.current,
                                    values: $valuesGridData.current
                                });
                            }
                        }}

        />
    </Vertical>
    </DimensionSelectorContext.Provider>

}