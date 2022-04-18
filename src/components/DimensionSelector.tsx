import React, {createContext, useCallback, useContext, useMemo} from "react";
import {ObserverValue, useObserver, useObserverListener, useObserverValue} from "../observer";
import Vertical from "../layout/Vertical";
import {Grid} from "../grid/Grid";
import Horizontal from "../layout/Horizontal";
import {emptyObserver, emptySetObserver, Observer} from "../observer/useObserver";
import {CellComponentStyledProps} from "../grid/Sheet";
import FilterSelector from "./FilterSelector";
import {Dimension} from "../App";
import {
    AiOutlineArrowDown,
    AiOutlineArrowUp,
    AiOutlineDelete,
    AiOutlineFilter,
    AiOutlineInsertRowAbove,
    AiOutlineInsertRowLeft,
    AiOutlineNumber
} from "react-icons/ai";
import {RiFilterLine} from "react-icons/ri";
import {BiCube} from "react-icons/bi";

const DimensionSelectorContext = createContext<{
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
    onFilterClicked: () => void,
    reRender:() => void
}>({
    setColumnsGridData: emptySetObserver,
    setRowsGridData: emptySetObserver,
    $focusedItem: emptyObserver,
    setFiltersGridData: emptySetObserver,
    $columnsGridData: emptyObserver,
    $rowsGridData: emptyObserver,
    $fieldsGridData: emptyObserver,
    $filtersGridData: emptyObserver,
    setValuesGridData: emptySetObserver,
    setFieldsGridData: emptySetObserver,
    $valuesGridData: emptyObserver,
    dimensionSelectorProps: {
        initialDimension: {dimensions: [], columns: [], filters: [], rows: [], values: []},
        $displayDimensionSelector: emptyObserver,
        onDimensionChanged: emptySetObserver
    },
    onFilterClicked: () => {
    },
    reRender:() => {}
});

interface DimensionSelectorProps {
    $displayDimensionSelector: Observer<boolean>;
    onDimensionChanged: (props: { columns: Array<Dimension>, rows: Array<Dimension>, filters: Array<Dimension>, values: Array<Dimension> }) => void,
    initialDimension: { filters: Array<Dimension>; columns: Array<Dimension>; rows: Array<Dimension>; values: Array<Dimension>; dimensions: Array<Dimension> };
}

export function DimensionSelector(dimensionSelectorProps: DimensionSelectorProps) {
    const localStorage = window.localStorage;
    const display = useObserverValue(dimensionSelectorProps.$displayDimensionSelector);

    const [$fieldsGridData, setFieldsGridData] = useObserver<Array<Dimension>>(dimensionSelectorProps.initialDimension.dimensions);
    const [$filtersGridData, setFiltersGridData] = useObserver<Array<Dimension>>(dimensionSelectorProps.initialDimension.filters);
    const [$columnsGridData, setColumnsGridData] = useObserver<Array<Dimension>>(dimensionSelectorProps.initialDimension.columns);
    const [$rowsGridData, setRowsGridData] = useObserver<Array<Dimension>>(dimensionSelectorProps.initialDimension.rows);
    const [$valuesGridData, setValuesGridData] = useObserver<Array<Dimension>>(dimensionSelectorProps.initialDimension.values);

    const [$displayFilterSelector, setDisplayFilterSelector] = useObserver<boolean>(false);

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
    const [$focusedItem, setFocusedItem] = useObserver<Dimension>({
        id: '',
        allSelected: false,
        filteredItems: [],
        name: ''
    });

    const reRender = useCallback(() => {
        if (dimensionSelectorProps.onDimensionChanged) {
            dimensionSelectorProps.onDimensionChanged({
                columns: $columnsGridData.current,
                rows: $rowsGridData.current,
                filters: $filtersGridData.current,
                values: $valuesGridData.current
            });
        }
    },[$columnsGridData, $filtersGridData, $rowsGridData, $valuesGridData, dimensionSelectorProps]);

    const contextProviderValue = useMemo(() => {
        function onFilterClicked() {
            setDisplayFilterSelector(true);
        }

        return {
            onFilterClicked,
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
            reRender
        }
    }, [reRender,$columnsGridData, $fieldsGridData, $filtersGridData, $focusedItem, $rowsGridData, $valuesGridData, dimensionSelectorProps, setColumnsGridData, setDisplayFilterSelector, setFieldsGridData, setFiltersGridData, setRowsGridData, setValuesGridData]);
    return <DimensionSelectorContext.Provider value={contextProviderValue}><Vertical
        onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
        }}
        style={{
            bottom: display ? 0 : -450,
            height: 450,
            right: 0,
            position: 'absolute',
            width: 500,
            transition: 'bottom 300ms ease-in-out',
            backgroundColor: '#fff',
            padding: '0rem',
            zIndex: 99,
            borderTopLeftRadius:10,
            overflow:'hidden',
            boxShadow: '0px 0px 20px 0px #666'
        }}>

        <Vertical style={{height: '33.33%'}}>
            <ObserverValue observers={[$fieldsGridData, $focusedItem]} render={() => {
                return <Grid defaultRowHeight={25} columns={[
                    {
                        title: <Horizontal><Vertical
                            style={{fontSize: 16, marginRight: 10}}><BiCube/></Vertical>{'Dimensions'}</Horizontal>,
                        field: 'name', hAlign: 'left', width: '100%', cellComponent: DimensionCellComponent
                    }
                ]} data={$fieldsGridData.current} rowResizerHidden={true}
                             defaultHeaderRowHeight={30}
                             focusedDataItem={$focusedItem.current}
                             filterHidden={true}
                             onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                />
            }}/>
        </Vertical>
        <Horizontal style={{height: '33.33%', overflow: 'auto', borderTop: '1px solid #999'}}>
            <Vertical style={{width: '50%', borderRight: '1px solid #CCC'}}>
                <ObserverValue observers={[$filtersGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={25} columns={[
                        {
                            title: <Horizontal><Vertical
                                style={{fontSize: 16, marginRight: 10}}><RiFilterLine/></Vertical>{'Filters'}
                            </Horizontal>,
                            field: 'name',
                            width: '100%',
                            hAlign: 'left',
                            cellComponent: ItemCellComponent,
                            payload: 'filter'
                        }
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
                    return <Grid defaultRowHeight={25} columns={[
                        {
                            title: <Horizontal><Vertical style={{
                                fontSize: 16,
                                marginRight: 10
                            }}><AiOutlineInsertRowAbove/></Vertical>{'Columns'}</Horizontal>,
                            field: 'name',
                            width: '100%',
                            hAlign: 'left',
                            cellComponent: ItemCellComponent,
                            payload: 'column'
                        }
                    ]} data={$columnsGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
        </Horizontal>
        <Horizontal style={{height: '33.33%', overflow: 'auto', borderTop: '1px solid #999'}}>
            <Vertical style={{width: '50%', borderRight: '1px solid #CCC'}}>
                <ObserverValue observers={[$rowsGridData, $focusedItem]} render={() => {
                    return <Grid defaultRowHeight={25} columns={[
                        {
                            title: <Horizontal><Vertical
                                style={{fontSize: 16, marginRight: 10}}><AiOutlineInsertRowLeft/></Vertical>{'Rows'}
                            </Horizontal>,
                            field: 'name',
                            width: '100%',
                            hAlign: 'left',
                            cellComponent: ItemCellComponent,
                            payload: 'row'
                        }
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
                    return <Grid defaultRowHeight={25} columns={[
                        {
                            title: <Horizontal><Vertical
                                style={{fontSize: 16, marginRight: 10}}><AiOutlineNumber/></Vertical>{'Values'}
                            </Horizontal>, field: 'name', width: '100%', hAlign: 'left', payload: 'value',

                            cellComponent:ItemCellComponent
                        }
                    ]} data={$valuesGridData.current} rowResizerHidden={true}
                                 defaultHeaderRowHeight={30}
                                 focusedDataItem={$focusedItem.current}
                                 filterHidden={true}
                                 onFocusedDataItemChange={(newItem) => setFocusedItem(newItem)}
                    />
                }}/>
            </Vertical>
        </Horizontal>
        <FilterSelector $displayFilterSelector={$displayFilterSelector}
                        setDisplayFilterSelector={setDisplayFilterSelector}
                        $selectedItem={$focusedItem}
                        onSelectedItemChanged={(selectedItem) => {
                            const isInFilters = $filtersGridData.current.indexOf($focusedItem.current) >= 0;
                            const isInRows = $rowsGridData.current.indexOf($focusedItem.current) >= 0;
                            const isInColumns = $columnsGridData.current.indexOf($focusedItem.current) >= 0;
                            if (isInFilters) {
                                setFiltersGridData(oldData => {
                                    const currentIndex = oldData.indexOf($focusedItem.current);
                                    oldData[currentIndex] = selectedItem;
                                    return [...oldData];
                                });
                            }
                            if (isInRows) {
                                setRowsGridData(oldData => {
                                    const currentIndex = oldData.indexOf($focusedItem.current);
                                    oldData[currentIndex] = selectedItem;
                                    return [...oldData];
                                });
                            }
                            if (isInColumns) {
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

function DimensionCellComponent(cellProps: CellComponentStyledProps) {
    const context = useContext(DimensionSelectorContext);
    const isNumber = cellProps.dataItem.isNumber;
    const isDimension = !isNumber;
    return <Horizontal style={cellProps.cellStyle} vAlign={'center'}>
        <Vertical style={{flexGrow: 1}}>
            {cellProps.value}
        </Vertical>
        <Visible visible={isDimension}>
            <Vertical style={{fontSize: 16, marginRight: 3, cursor: 'pointer'}} title={'Add To Row'} onClick={() => {
                context.setFieldsGridData((old: Array<any>) => {
                    return old.filter(i => i.id !== cellProps.dataItem.id);
                })
                context.setRowsGridData((old: Array<any>) => {
                    return [...old, cellProps.dataItem];
                });
                context.reRender();
            }}>
                <AiOutlineInsertRowLeft/>
            </Vertical>
        </Visible>
        <Visible visible={isDimension}>
            <Vertical style={{fontSize: 16, marginRight: 3, cursor: 'pointer'}} title={'Add To Column'} onClick={() => {
                context.setFieldsGridData((old: Array<any>) => {
                    return old.filter(i => i.id !== cellProps.dataItem.id);
                })
                context.setColumnsGridData((old: Array<any>) => {
                    return [...old, cellProps.dataItem];
                });
                context.reRender();
            }}>
                <AiOutlineInsertRowAbove/>
            </Vertical>
        </Visible>
        <Visible visible={isDimension}>
            <Vertical style={{fontSize: 16, marginRight: 3, cursor: 'pointer'}} title={'Add To Filter'} onClick={() => {
                context.setFieldsGridData((old: Array<any>) => {
                    return old.filter(i => i.id !== cellProps.dataItem.id);
                })
                context.setFiltersGridData((old: Array<any>) => {
                    return [...old, cellProps.dataItem];
                });
                context.reRender();
            }}>
                <AiOutlineFilter/>
            </Vertical>
        </Visible>
        <Visible visible={isNumber}>
            <Vertical style={{fontSize: 16, marginRight: 3, cursor: 'pointer'}} title={'Add To Value'} onClick={() => {
                context.setFieldsGridData((old: Array<any>) => {
                    return old.filter(i => i.id !== cellProps.dataItem.id);
                })
                context.setValuesGridData((old: Array<any>) => {
                    return [...old, cellProps.dataItem];
                });
                context.reRender();
            }}>
                <AiOutlineNumber/>
            </Vertical>
        </Visible>
    </Horizontal>
}

function Visible({visible, children}: { visible: boolean, children: any }) {
    if (visible) {
        return children;
    }
    return <Vertical onClick={(event) => event.preventDefault()} style={{opacity:0.1}}>
        {children}
    </Vertical>;
}

function ItemCellComponent(props: CellComponentStyledProps) {
    const type = props.column.payload;
    const context = useContext(DimensionSelectorContext);
    const isNumber = props.dataItem.isNumber;
    const isDimension = !isNumber;
    const rowIndex = props.rowIndex;
    return <Horizontal style={{...props.cellStyle, paddingRight: 0}} vAlign={'center'}>
        <Vertical style={{flexGrow: 1}}>
            {props.value}
        </Vertical>

        <Visible visible={rowIndex > 0}>
            <Vertical style={{fontSize: 16, padding: '0px 3px', borderLeft: '1px solid #ddd'}}
                      onClick={() => {
                          let setState:(prop:any) => void = () => {};
                          if (type === 'filter') {
                              setState = context.setFiltersGridData;
                          }
                          if (type === 'column') {
                              setState = context.setColumnsGridData;
                          }
                          if (type === 'row') {
                              setState = context.setRowsGridData;
                          }
                          if (type === 'value') {
                              setState = context.setValuesGridData;
                          }
                          setState((old: Array<any>) => {
                              const itemIndex = old.indexOf(props.dataItem);
                              const itemAbove = old[itemIndex - 1];
                              const dataItem = [...old];
                              dataItem[itemIndex - 1] = props.dataItem;
                              dataItem[itemIndex] = itemAbove;
                              return dataItem;
                          });
                          context.reRender();
                      }}>
                <AiOutlineArrowUp/>
            </Vertical>
        </Visible>
        <Visible visible={rowIndex < (props.dataSource.length - 1)}>
            <Vertical style={{fontSize: 16, padding: '0px 3px', borderLeft: '1px solid #ddd'}}
                      onClick={() => {
                          let setState:(prop:any) => void = () => {};
                          if (type === 'filter') {
                              setState = context.setFiltersGridData;
                          }
                          if (type === 'column') {
                              setState = context.setColumnsGridData;
                          }
                          if (type === 'row') {
                              setState = context.setRowsGridData;
                          }
                          if (type === 'value') {
                              setState = context.setValuesGridData;
                          }
                          setState((old: Array<any>) => {
                              const itemIndex = old.indexOf(props.dataItem);
                              const itemBelow = old[itemIndex + 1];
                              const dataItem = [...old];
                              dataItem[itemIndex + 1] = props.dataItem;
                              dataItem[itemIndex] = itemBelow;
                              return dataItem;
                          });
                          context.reRender();
                      }}>
                <AiOutlineArrowDown/>
            </Vertical>
        </Visible>
        <Visible visible={isDimension}>
        <Vertical style={{fontSize: 16, padding: '0px 3px', borderLeft: '1px solid #ddd'}}
                  onClick={() => context.onFilterClicked()}>
            <RiFilterLine/>
        </Vertical>
        </Visible>
        <Vertical style={{fontSize: 16, marginRight: 3, cursor: 'pointer'}} title={'Delete'} onClick={() => {
            context.setFieldsGridData((old: Array<any>) => {
                return [...old,props.dataItem];
            });
            if (type === 'filter') {
                context.setFiltersGridData((old: Array<any>) => {
                    return old.filter(i => i.id !== props.dataItem.id);
                })
            }
            if (type === 'row') {
                context.setRowsGridData((old: Array<any>) => {
                    return old.filter(i => i.id !== props.dataItem.id);
                })
            }
            if (type === 'column') {
                context.setColumnsGridData((old: Array<any>) => {
                    return old.filter(i => i.id !== props.dataItem.id);
                })
            }
            if (type === 'value') {
                context.setValuesGridData((old: Array<any>) => {
                    return old.filter(i => i.id !== props.dataItem.id);
                })
            }
            context.reRender();
        }}>
            <AiOutlineDelete/>
        </Vertical>


    </Horizontal>
}