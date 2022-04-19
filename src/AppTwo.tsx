import Vertical from "./layout/Vertical";
import {DimensionSelector} from "./components/DimensionSelector";
import React, {useEffect, useState} from "react";
import {useObserver} from "./observer";
import {Dimension, dimensions} from "./App";
import Horizontal from "./layout/Horizontal";
import {IoSettingsOutline} from "react-icons/io5";
import {AiOutlineFileExcel} from "react-icons/ai";
import * as XLSX from "xlsx";

async function fetchGridData(rows: Array<Dimension>, columns: Array<Dimension>, filters: Array<Dimension>, values: Array<Dimension>) {
    const condition = [...rows, ...columns].map(d => `"${d.id}"`).join(",");
    const filtersWhere = [...rows, ...columns, ...filters].filter(d => d.filteredItems.length > 0).map(d => `"${d.id}" in (${d.filteredItems.map(i => `'${i}'`).join(',')})`).join(" and ");
    const valueQuery = values.map((val: Dimension) => `sum(${val.id}) as ${val.id}`).join(' , ');
    const where = filtersWhere ? "where " + filtersWhere : ""
    const query = `select ${valueQuery},${condition} from sales ${where} group by ${condition}`;

    return await fetchPost('query', {query});
}

function noOp() {
}


export default function AppTwo() {
    const [$displayDimensionSelector, setDisplayDimensionSelector] = useObserver(false);
    const [dimension, setDimension] = useState(() => {
        const filters = loadDimension('filters');
        const columns = loadDimension('columns');
        const rows = loadDimension('rows');
        const values = loadDimension('values');
        const dim = dimensions.filter((d: any) => {
            return !(filters.map((i: any) => i?.id).includes(d.id) || columns.map((i: any) => i?.id).includes(d.id) || rows.map((i: any) => i?.id).includes(d.id) || values.map((i: any) => i?.id).includes(d.id))
        });
        return {filters, columns, rows, values, dimensions: dim}
    });
    const [gridData, setGridData] = useState([]);
    const [gridHeaderData, setGridHeaderData] = useState<Array<any>>([]);
    const [gridRowsData, setGridRowsData] = useState<Array<any>>([]);

    useEffect(() => {
        const rows = gridData.reduce((acc: Array<any>, rowData: any) => {
            const mappedRowData: any = {id: ''};
            dimension.rows.forEach((r: Dimension) => {
                mappedRowData[r.id] = rowData[r.id];
                mappedRowData.id = mappedRowData.id + rowData[r.id]
            });
            if (acc.find((d: any) => d.id === mappedRowData.id) === undefined) {
                acc.push(mappedRowData);
            }
            return acc;
        }, []);
        if (rows.length > 100) {
            console.warn('Rows is more than 100, please consider adding filter');
            console.table(rows);
            return;
        }
        setGridRowsData(rows);

    }, [dimension.rows, gridData]);

    useEffect(() => {
        (async () => {
            const {rows, columns, filters, values} = dimension;
            if (!(values.length > 0)) {
                return;
            }
            const result = await fetchGridData(rows, columns, filters, values);
            const gridHeaderColumnData = result.reduce((gridHeaderColumn: any, row: any) => {
                columns.reduce((acc: any, dim: Dimension) => {
                    const dimVal = row[dim.id];
                    acc[dimVal] = acc[dimVal] || {type: dim.id, label: dimVal, children: {}};
                    return acc[dimVal].children;
                }, gridHeaderColumn);
                return gridHeaderColumn;
            }, {});

            const gridHeaderRowData: Array<any> = [];

            function populateGridHeaderRowData(index: number, cellData: any, addParentRow: () => any) {
                const isLastIndex = index === columns.length - 1;
                Object.keys(cellData).forEach((key: string) => {
                    gridHeaderRowData[index] = gridHeaderRowData[index] || [];
                    const val = cellData[key];

                    function addOneRow() {
                        const parent = addParentRow();
                        const lastGridRow = gridHeaderRowData[index][gridHeaderRowData[index].length - 1];
                        if (lastGridRow && lastGridRow.label === val.label) {
                            lastGridRow.colSpan++;
                            return lastGridRow;
                        } else {
                            const item = {label: val.label, type: val.type, colSpan: 1, parent};
                            gridHeaderRowData[index].push(item);
                            return item;
                        }
                    }

                    if (isLastIndex) {
                        addOneRow();
                    }

                    populateGridHeaderRowData(index + 1, val.children, addOneRow);
                })
            }

            populateGridHeaderRowData(0, gridHeaderColumnData, noOp);
            if ((gridHeaderRowData[gridHeaderRowData.length - 1].length) > 100) {
                console.warn('Columns is more than 100, please consider adding filter');
                console.table(gridHeaderRowData);
                return;
            }
            setGridHeaderData(gridHeaderRowData);
            setGridData(result);
        })();

    }, [dimension])
    return <Vertical style={{height: '100%', overflow: 'hidden', position: 'relative'}} onClick={() => {
        setDisplayDimensionSelector(false);
    }}>

        <Vertical style={{height: '100%', overflow: 'auto'}}>
            <table style={{borderCollapse: "collapse"}} id={'table'}>
                <thead>

                {gridHeaderData.map((row: any, rowIndex: number) => {
                    return <tr key={`header-row-${rowIndex}`} style={{border: '1px solid #ccc'}}>
                        {rowIndex === 0 && dimension.rows.map((r: Dimension) => {
                            return <th key={r.id} rowSpan={dimension.columns.length} style={{border: '1px solid #ccc'}}>
                                {r.name}
                            </th>
                        })}
                        {row.map((cell: any, colIndex: number) => {
                            return <th key={`header-row-${rowIndex}-${colIndex}`} colSpan={cell.colSpan}
                                       style={{border: '1px solid #ccc'}}>
                                {cell.label}
                            </th>
                        })}
                    </tr>
                })}
                </thead>
                <tbody>
                {gridRowsData.map((data: any, rowIndex: number) => {
                    const gridDataForHeader = gridHeaderData[gridHeaderData.length - 1];
                    return <tr key={`row-${rowIndex}`}>
                        {dimension.rows.map((r: Dimension, colIndex: number) => {
                            return <td key={`row-${rowIndex}-${colIndex}`} style={{border: '1px solid #ccc'}}>
                                {data[r.id]}
                            </td>
                        })}
                        {gridDataForHeader.map((cell: any, index: number) => {
                            const colIndex = index + dimension.rows.length;

                            const filteredGridData: any = gridData.find((gd: any) => {
                                for (let row of dimension.rows) {
                                    if (gd[row.id] !== data[row.id]) {
                                        return false;
                                    }
                                }

                                function isCellTypeAndLabelMatch(cell: any, gd: any): boolean {
                                    if (gd[cell.type] !== cell.label) {
                                        return false;
                                    }
                                    if (cell.parent) {
                                        return isCellTypeAndLabelMatch(cell.parent, gd);
                                    }
                                    return true;
                                }

                                return isCellTypeAndLabelMatch(cell, gd);
                            }) || {};
                            const hasValue = 'value' in filteredGridData;
                            const hasQuantity = 'quantity' in filteredGridData;
                            const value = parseInt((filteredGridData || {value: '0'}).value || '0');
                            const quantity = (filteredGridData || {quantity: 0}).quantity;
                            return <td key={`row-${rowIndex}-${colIndex}`} style={{border: '1px solid #ccc'}}>
                                <Horizontal style={{width: '100%'}}>
                                    {hasQuantity && <Vertical style={{flexGrow: 1}}>
                                        {numberFormat.format(quantity)}
                                    </Vertical>}
                                    {hasValue && <Vertical style={{flexGrow: 1}}>
                                        {numberFormat.format(value)}
                                    </Vertical>}
                                </Horizontal>
                            </td>
                        })}
                    </tr>
                })}
                </tbody>
            </table>

        </Vertical>
        <Vertical style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            border: '1px solid #ddd',
            cursor: 'pointer',
            borderRadius: 50,
            width: 50,
            height: 50,
            fontSize: 40,
            backgroundColor: 'rgba(0,0,0,0.1)',
            color: '#333',
            boxShadow: '0px 0px 5px -3px rgba(0,0,0,0.9)'
        }} hAlign={'center'}
                  vAlign={'center'}
                  onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDisplayDimensionSelector(true);
                  }}>
            <IoSettingsOutline/>
        </Vertical>

        <Vertical style={{
            position: 'absolute',
            bottom: 10,
            right: 70,
            border: '1px solid #ddd',
            cursor: 'pointer',
            borderRadius: 50,
            width: 50,
            height: 50,
            fontSize: 40,
            backgroundColor: 'rgba(0,0,0,0.1)',
            color: '#333',
            boxShadow: '0px 0px 5px -3px rgba(0,0,0,0.9)'
        }} hAlign={'center'}
                  vAlign={'center'}
                  onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      // Acquire Data (reference to the HTML table)
                      let table_elt = document.getElementById("table");
                      // Extract Data (create a workbook object from the table)
                      let workbook = XLSX.utils.table_to_book(table_elt);
                      // Process Data (add a new row)
                      let ws = workbook.Sheets["Sheet1"];
                      XLSX.utils.sheet_add_aoa(ws, [["Created " + new Date().toISOString()]], {origin: -1});
                      // Package and Release Data (`writeFile` tries to write and save an XLSB file)
                      XLSX.writeFileXLSX(workbook, "Report.xlsx")
                      //XLSX.writeFile(workbook, "Report.xlsb");
                  }}>
            <AiOutlineFileExcel/>
        </Vertical>
        <DimensionSelector $displayDimensionSelector={$displayDimensionSelector}
                           onDimensionChanged={async (props) => {
                               const {rows, columns, values, filters} = props;
                               setDimension((old) => {
                                   return {...old, rows, columns, values, filters}
                               })
                           }} initialDimension={dimension}/>
    </Vertical>
}


function loadDimension(dimensionName: string): Array<Dimension> {
    const dimension = localStorage.getItem(dimensionName);
    if (dimension) {
        return JSON.parse(dimension);
    }
    return []
}

async function fetchPost(action: string, body: any) {
    const {hostname, protocol} = window.location;
    const address = `${protocol}//${hostname}:3001/v1/${action}`;

    const options = {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(body),
    };
    const result = await window.fetch(address, options)
    return await result.json();
}

const numberFormat = new Intl.NumberFormat();