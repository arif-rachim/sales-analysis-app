import {defaultCellSpanFunction, GridColumn, GridColumnGroup} from "./grid/Grid";

import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import Vertical from "./layout/Vertical";
import Horizontal from "./layout/Horizontal";
import {ObserverValue, useObserver} from "./observer";
import {CellComponentStyledProps} from "./grid/Sheet";
import {generateUniqueID} from "web-vitals/dist/modules/lib/generateUniqueID";
import {DimensionSelector} from "./components/DimensionSelector";
import {PivotGrid} from "./components/PivotGrid";
import {IoSettingsOutline} from "react-icons/io5";

const FIELD_SEPARATOR: string = '⚮';

const SalesSchema: any = {
    quantity: {
        name: 'QTY',
        isNumber: true,
        allSelected: true,
        filteredItems: []
    },
    value: {
        name: 'AED',
        isNumber: true,
        allSelected: true,
        filteredItems: []
    },
    storeCode: {
        name: 'Store Code',
        allSelected: true,
        filteredItems: []
    },
    storeName: {
        name: 'Store Name',
        allSelected: true,
        filteredItems: []
    },
    store: {
        name: 'Store Type',
        allSelected: true,
        filteredItems: []
    },
    location: {
        name: 'Store Location',
        allSelected: true,
        filteredItems: []
    },
    city: {
        name: 'Store City',
        allSelected: true,
        filteredItems: []
    },
    groupCode: {
        name: 'Material Group Code',
        allSelected: true,
        filteredItems: []
    },
    groupName: {
        name: 'Material Group Name',
        allSelected: true,
        filteredItems: []
    },
    brand: {
        name: 'Material Brand',
        allSelected: true,
        filteredItems: []
    },
    code: {
        name: 'Material Code',
        allSelected: true,
        filteredItems: []
    },
    name: {
        name: 'Material Name',
        allSelected: true,
        filteredItems: []
    },
    category: {
        name: 'Material Category',
        allSelected: true,
        filteredItems: []
    },
    date: {
        name: 'Date',
        allSelected: true,
        filteredItems: []
    },
};

export interface Dimension {
    id: string;
    name: string;
    allSelected: boolean;
    filteredItems: Array<string>;
}

const dimensions: Array<Dimension> = Object.keys(SalesSchema).map((key: string) => {
    const item = SalesSchema[key];
    return {id: key, ...item}
})


function loadDimension(dimensionName: string): Array<Dimension> {
    const dimension = localStorage.getItem(dimensionName);
    if (dimension) {
        return JSON.parse(dimension);
    }
    return []
}

async function renderGrid(props: { filters: Array<Dimension>, columns: Array<Dimension>; rows: Array<Dimension>; values: Array<Dimension>; setPinnedLeftColumnIndex: any; setGridColumns: any; setGridRows: any }) {
    const column = props.columns[0];
    if (column === undefined) {
        return;
    }
    const row = props.rows[0];
    if (row === undefined) {
        return;
    }

    const value = props.values[0];

    if (value === undefined) {
        return;
    }

    let [columnsData, rowsData] = await Promise.all([fetchData('distinct/' + props.columns.map((col: Dimension) => col.id).join('_')), fetchData('distinct/' + props.rows.map((row: Dimension) => row.id).join('_'))]);

    rowsData = rowsData.map((row: any) => {
        const [key] = Object.keys(row);
        const keys = key.split('_');
        const val = row[key];
        const values = val.split('#');
        return keys.reduce((out: any, key: string, index: number) => {
            out[key] = values[index];
            return out;
        }, {});
    });
    rowsData = rowsData.filter((rowData: any) => {
        return props.rows.reduce((acc: boolean, row: Dimension) => {
            if (row.allSelected) {
                return acc && true;
            }
            const fieldValue = rowData[row.id];
            return acc && row.filteredItems.includes(fieldValue);
        }, true);
    });
    if (rowsData.length === 0) {
        return;
    }
    const cols = Object.keys(rowsData[0]).map(key => {
        const column: GridColumn = {
            width: 100,
            field: key,
            title: key,
            hAlign: 'center',
            cellSpanFunction: defaultCellSpanFunction,
            cellComponent: CellComponent
        };
        return column;
    });
    const colsLength = cols.length;

    const gridColumnsData: Array<GridColumn | GridColumnGroup> = columnsData.filter((colData: any) => {
        // we filter first
        const colKey: string = Object.keys(colData)[0];
        const colVal: string = colData[colKey];
        const keys: Array<string> = colKey.split('_');
        const values: Array<string> = colVal.split('#');
        const data = keys.reduce((acc: any, key: string, index: number) => {
            acc[key] = values[index];
            return acc;
        }, {});
        return props.columns.reduce((acc: boolean, col: Dimension) => {
            if (col.allSelected) {
                return acc && true;
            }
            const fieldValue = data[col.id];
            return acc && col.filteredItems.includes(fieldValue);
        }, true);

    }).reduce((acc: Array<GridColumn | GridColumnGroup>, colData: any) => {
        const colKey: string = Object.keys(colData)[0];
        const colVal: string = colData[colKey];
        const keys: Array<string> = colKey.split('_');
        const values: Array<string> = colVal.split('#');

        const lastIndexKey = keys.length;
        keys.reduce((acc: Array<GridColumn | GridColumnGroup>, key: string, index: number) => {
            const isNotLastIndex = index < (lastIndexKey - 1);
            const title = values[index];
            const existingChild: any = acc.find((ac: any) => ac.title === title);
            if (existingChild) {
                const child: GridColumnGroup = existingChild;
                return child.columns;
            }
            const child: any = {};
            if (isNotLastIndex) {
                const group: GridColumnGroup = child;
                group.columns = [];
                group.title = title;

            } else {
                const group: GridColumnGroup = child;
                group.title = title;
                group.columns = props.values.map((value: any) => {
                    const column: GridColumn = {
                        title: value.name,
                        hAlign: 'center',
                        field: colVal + FIELD_SEPARATOR + colKey + FIELD_SEPARATOR + value.id,
                        width: 100,
                        payload: {
                            filters: props.filters
                        },
                        cellComponent: FetchDataCellComponent
                    };
                    return column;
                });

            }
            acc.push(child);
            return child.columns;
        }, acc);
        return acc;
    }, cols);

    props.setPinnedLeftColumnIndex(colsLength - 1);
    props.setGridColumns(gridColumnsData);
    props.setGridRows(rowsData);
}

const AppContext = createContext<any>({});


/**
 * Todo we need todo following things
 * 1. Add cors to fastify
 * 2. Add fetch to list dimension
 * 3. Add fetch to list columns and rows
 * @constructor
 */
export default function App() {

    const [$displayDimensionSelector, setDisplayDimensionSelector] = useObserver(false);

    const [$pinnedLeftColumnIndex, setPinnedLeftColumnIndex] = useObserver(-1);
    const [$gridColumns, setGridColumns] = useObserver<Array<GridColumn | GridColumnGroup>>([]);
    const [$gridRows, setGridRows] = useObserver([]);
    const [initialDimension] = useState(() => {
        const filters = loadDimension('filters');
        const columns = loadDimension('columns');
        const rows = loadDimension('rows');
        const values = loadDimension('values');
        const dim = dimensions.filter((d: any) => {
            return !(filters.map((i: any) => i?.id).includes(d.id) || columns.map((i: any) => i?.id).includes(d.id) || rows.map((i: any) => i?.id).includes(d.id) || values.map((i: any) => i?.id).includes(d.id))
        });
        return {filters, columns, rows, values, dimensions: dim}
    });

    const {rows, columns, values, filters} = initialDimension;
    useEffect(() => {
        renderGrid({filters, columns, rows, values, setPinnedLeftColumnIndex, setGridColumns, setGridRows}).then();
    }, [rows, columns, values, filters, setPinnedLeftColumnIndex, setGridColumns, setGridRows]);
    const fetchData = useFetchPostData();

    return <AppContext.Provider value={useMemo(() => ({fetchData}), [fetchData])}>
        <Vertical style={{height: '100%', overflow: 'hidden', position: 'relative'}}>
            <Vertical style={{flexGrow: 1, overflow: 'auto'}}
                      onClick={() => {
                          setDisplayDimensionSelector(false);
                      }}>

                <PivotGrid $gridColumns={$gridColumns}
                           $gridRows={$gridRows} $pinnedLeftColumnIndex={$pinnedLeftColumnIndex}/></Vertical>
            <Horizontal>
                <Vertical style={{position:'absolute',bottom:10,right:10,border:'1px solid #ddd',cursor:'pointer',borderRadius:50,width:50,height:50,fontSize:40,backgroundColor:'rgba(0,0,0,0.1)',color:'#333',boxShadow:'0px 0px 5px -3px rgba(0,0,0,0.9)'}} hAlign={'center'}
                          vAlign={'center'}
                          onClick={() => {
                              setDisplayDimensionSelector(true);
                          }}>
                    <IoSettingsOutline/>
                </Vertical>
            </Horizontal>
            <DimensionSelector $displayDimensionSelector={$displayDimensionSelector}
                               onDimensionChanged={async (props) => {
                                   const {rows, columns, values, filters} = props;
                                   await renderGrid({
                                       filters,
                                       columns,
                                       rows,
                                       values,
                                       setPinnedLeftColumnIndex,
                                       setGridColumns,
                                       setGridRows
                                   });
                               }} initialDimension={initialDimension}/>
        </Vertical>
    </AppContext.Provider>
}

export function debounce(func: Function, timeout = 300) {
    let timer: any = 0;
    return (...args: any) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            // @ts-ignore
            func.apply(this, args);
        }, timeout);
    };
}

function useFetchPostData() {
    const requestRef = useRef<any>([]);
    const fireImmediateRequestToServer = useCallback(function fireRequestToServer() {
        const request = requestRef.current;
        if (request.length === 0) {
            return;
        }
        const {hostname, protocol} = window.location;
        const address = `${protocol}//${hostname}:3001/v1/compoundRequest`;
        requestRef.current = [];
        const options = {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json;charset=UTF-8",
            },
            body: JSON.stringify(request.map((r: any) => ({id: r.id, method: r.method, body: r.body}))),
        };
        (async () => {
            try {
                const result = await window.fetch(address, options)
                const json = await result.json();
                json.forEach(({value, id}: any) => {
                    const req = request.find((req: any) => req.id === id);
                    req.resolve(value);
                });
            } catch (error) {
                console.warn(error);
            }
        })();
    }, []);
    // eslint-disable-next-line
    const fireDebounceRequestToServer = useCallback(debounce(fireImmediateRequestToServer, 300), []);
    return useCallback(function fetchPostData(url: string, body: any) {
        return new Promise(resolve => {
            const id = generateUniqueID();
            requestRef.current.push({id, method: url, body, resolve});
            if (requestRef.current.length > 100) {
                fireImmediateRequestToServer();
            } else {
                fireDebounceRequestToServer();
            }
        });
    }, [fireDebounceRequestToServer, fireImmediateRequestToServer]);
}


export async function fetchData(url: string, signal?: AbortSignal) {
    const {hostname, protocol} = window.location;
    const address = `${protocol}//${hostname}:3001/v1/${url}`;
    try {
        const result = await window.fetch(address, {signal});
        return await result.json();
    } catch (error) {
        console.warn(error);
        return []
    }
}

function CellComponent(props: CellComponentStyledProps) {
    return <Vertical vAlign={'center'} style={{height: '100%', padding: '2px 5px'}}>
        {props.value}
    </Vertical>
}

const numberFormat = new Intl.NumberFormat();

function FetchDataCellComponent(props: CellComponentStyledProps) {
    const {fetchData} = useContext(AppContext);
    const [colValFiltersString, colKeyFiltersString, valueType] = props.column.field.split(FIELD_SEPARATOR);
    const dataItemString = JSON.stringify(props.dataItem);
    const {filters: onlyContains} = props.column.payload;
    const [$value, setValue] = useObserver<any>('loading');
    useEffect(() => {
        const dataItem = JSON.parse(dataItemString);
        const colKeyFilters = colKeyFiltersString.split('_');
        const colValFilters = colValFiltersString.split('#');
        const rowKeyFilters = Object.keys(dataItem);
        const rowValFilters = rowKeyFilters.map(key => dataItem[key]);
        const ocs = onlyContains.filter((oc: Dimension) => !oc.allSelected && oc.filteredItems.length > 0).reduce((acc: any, oc: Dimension) => {
            acc[oc.id] = oc.filteredItems;
            return acc;
        }, {});
        const filters = [...colKeyFilters, ...rowKeyFilters];
        const values = [...colValFilters, ...rowValFilters];

        (async () => {
            setValue('loading');
            try {
                const result = await fetchData(valueType, {filters, values, onlyContains: ocs});
                const value = parseInt(result || '0');
                setValue(value);
            } catch (err) {
                console.log(err);
            }
        })();
    }, [colKeyFiltersString, onlyContains, colValFiltersString, dataItemString, fetchData, setValue, valueType])

    return <Vertical vAlign={'center'} style={{height: '100%'}}>
        <ObserverValue observers={$value} render={() => {
            return <Vertical
                style={{
                    textAlign: 'right',
                    padding: '2px 5px'
                }}>{$value.current === 'loading' ? 'Loading...' : numberFormat.format($value.current)}</Vertical>
        }}/>
    </Vertical>
}
