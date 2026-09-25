# Sales Analysis App

Sales Analysis App is a small, self-hosted pivot-table tool, written in March and April 2022, for analysing retail sales exports by store, city, product and month. The sales data arrives as Excel workbooks with products in rows and one quantity column and one value column per store and month. An import script reads every workbook in a local `data-source/` folder, looks up product categories and store names and cities in a lookup workbook (`kamus.xls`), flattens everything into one `sales` table in PostgreSQL through Sequelize, calculates an average price per row, and remembers which files were already imported. A Fastify server on port 3001 exposes that table, and a React 17 and TypeScript front end (Create React App) lets the user drag dimensions such as store, city, brand, category, year and month into rows, columns and filters, choose sums of quantity, value or price as values, and see the result in a pivot table with nested column headers that can be exported to an Excel file. It is an internal prototype meant to run on a local machine, not a hosted product.

> Prototype from 2022. Not actively maintained, and not safe to expose to a network (see Limitations).

## Features

- **Excel import:** `npm run datasource:import` reads all new workbooks in `data-source/`, keeps only quantity columns that have a matching value column for the same store and month, skips rows with zero quantity or value, and records imported file names so they are not loaded twice
- **Lookup data:** `kamus.xls` maps material group codes to categories (first sheet) and store codes to store names and cities (second sheet); an unknown store code stops the import with an error
- **Pivot configuration:** a dimension selector with rows, columns, filters and values areas; the configuration is saved in the browser's localStorage
- **Filtering:** pick distinct values per dimension (loaded from `/v1/distinct/:column`)
- **Pivot table:** the current view renders a plain HTML table with nested column headers and column spans, and refuses to render more than 100 rows or 100 columns (a console warning asks for a filter instead). The earlier view in `src/App.tsx` used a virtualised `PivotGrid` with resizable rows and columns
- **Excel export:** downloads the current table as `Report.xlsx` with a creation timestamp

## Tech stack

React 17 · TypeScript · Create React App · Fastify 3 · Sequelize 6 · PostgreSQL · SheetJS (`xlsx`) · react-icons

## Getting started

Prerequisites: Node.js, npm and a local PostgreSQL server with a `sales` database. The connection string is currently hard-coded in `src/model.js`; change it to match your database before running anything.

```bash
npm install

# 1. put the sales workbooks in ./data-source/ (git-ignored), then import them
npm run datasource:import      # runs with --max-old-space-size=4096

# 2. start the API on port 3001
npm run start:server

# 3. start the React client
npm run start:client           # http://localhost:3000
npm run build:client
npm run test:client
```

The client calls the API on port 3001 of the same host name it was loaded from.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/v1/dimension` | List the columns of the `sales` table with their labels and whether they can be summed |
| `GET` | `/v1/distinct/:columnName` | Distinct values of one column (or of several joined with `_`) |
| `POST` | `/v1/query` | Run the SQL query sent by the client (used by the current pivot view) |
| `POST` | `/v1/compoundRequest` | Run several `sum(...)` sub-queries in one statement (used by the older view in `src/App.tsx`) |

`tableIndex.js` lists the database indexes; `/v1/compoundRequest` logs a `[Missing Index]` line when a query uses a column combination that has no index.

## Project structure

```text
import-datasource.js     # Excel → PostgreSQL import
server.js                # Fastify API
tableIndex.js            # index definitions for the sales table
kamus.xls                # category and store lookup workbook
src/
├── model.js             # Sequelize connection and the Sales / ImportedFile models
├── AppTwo.tsx           # current pivot view (rendered by index.tsx)
├── App.tsx              # earlier view, still provides the dimension list
├── components/          # DimensionSelector, FilterSelector, PivotGrid (used by App.tsx)
├── grid/                # virtualised Grid and Sheet components
├── observer/            # small observer hooks used for shared state
└── layout/              # Horizontal / Vertical flex helpers
```

## Limitations

- **Security:** `/v1/query` executes any SQL it receives, and other endpoints build SQL from request values, so the API must never be reachable from an untrusted network.
- The database connection string, including its credentials, is hard-coded in `src/model.js` instead of read from environment variables.
- The `elasticity` column is created but always set to 0.
- The import script expects one specific workbook layout (product columns first, store code, store name and month in the header rows).
