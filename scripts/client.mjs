#!/bin/env node

import { readFileSync, writeFileSync } from "fs"

const file = readFileSync("./data/client.json", "utf8")
const data = JSON.parse(file)

const rows = Object.keys(data).length;
const experiments = Object.keys(data[Object.keys(data)[0]]);

/**
 * @param {string} e 
 */
function experimentLabel(e) {
    switch (e) {
        case "setup relic new": return "Initial load";
        case "setup relic existing": return "Subsequent load";
        case "select limit 1": return "Select 1 rows";
        case "select limit 10": return "Select 10 rows";
        case "select limit 100": return "Select 100 rows";
        case "select join": return "Select 10 joined";
        case "create reservation": return "Create reservation";
        case "update reservation": return "Update reservation";
        case "delete reservation": return "Delete reservation";
    }

    throw new Error("Unknown experiment: " + e);
}

/**
 * @param {string[]} strings
 */
export function legend(...strings) {
    return `\\legend{${strings.join(",")}}`
}

/**
 * @param {Array<{x: number, y: number}>} data
 */
export function addPlot(data) {
    return `\\addplot coordinates {
${data.map(d => `(${d.x},${d.y})`).join("\n")}
};`
}

/**
 * @param {string} children
 * @param {string} ylabel
 * @param {string} xlabel
 */
export function tikzpicture(children, ylabel, xlabel) {
    return `\\begin{tikzpicture}
\\begin{axis}[
    scaled x ticks=false,
    xticklabel style={
        /pgf/number format/fixed,
    },
    enlargelimits=0.05,
    xmode=log,
    legend pos=north west,
	ylabel=${ylabel},
    xlabel=${xlabel},
]
${children}
\\end{axis}
\\end{tikzpicture}
`
}

export function figure(children, caption, label) {
    return `\\begin{figure}[H]
    \\centering

${children}
    
    \\caption{${caption}}
    \\label{${label}}
\\end{figure}`
}

export function subFigure(children, caption, label) {
    return `\\begin{subfigure}[b]{0.48\\textwidth}
    \\centering
    
${children}

    \\caption{${caption}}
    \\label{${label}}
\\end{subfigure}`
}

export function resizeBox(children) {
    return `\\resizebox{\\textwidth}{!}{
${children}
}`
}


export function loadTimesSubFigure() {
    const plots = [
        'setup relic new',
        'setup relic existing'
    ].map(e => addPlot(Object.keys(data).map(r => ({ x: parseInt(r), y: data[r][e].mean / 1000 }))));
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") + "\n" + legend("Initial load", "Subsequent load"),
                "Duration (s)",
                "Total number of rows"
            )),
        "Duration in seconds of setting up and loading the data for a new and existing Relic instance by total number of rows.",
        "fig:client-load-times"
    )
}

export function selectNSubFigure() {
    const plots = [
        'select limit 1',
        'select limit 10',
        'select limit 100'
    ].map(e => addPlot(Object.keys(data).map(r => ({ x: parseInt(r), y: data[r][e].mean }))));
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") + "\n" + legend("Select 1 row", "Select 10 rows", "Select 100 rows"),
                "Duration (ms)",
                "Total number of rows"
            )),
        "Duration in milliseconds of selecting 1, 10 and 100 rows by total number of rows in the database.",
        "fig:client-select-n"
    )
}

export function selectAdvancedSubFigure() {
    const plots = [
        'select join',
    ].map(e => addPlot(Object.keys(data).map(r => ({ x: parseInt(r), y: data[r][e].mean }))));
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") + "\n" + legend("Select 10 joined"),
                "Duration (ms)",
                "Total number of rows"
            )),
        "Duration in milliseconds of selecting 10 rows using a join by total number of rows in the database.",
        "fig:client-select-advanced"
    )
}

export function operationsSubFigure() {
    const plots = [
        'create reservation',
        'update reservation',
        'delete reservation'
    ].map(e => addPlot(Object.keys(data).map(r => ({ x: parseInt(r), y: data[r][e].mean }))));
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") + "\n" + legend("Create reservation", "Update reservation", "Delete reservation"),
                "Duration (ms)",
                "Total number of rows"
            )),
        "Duration in milliseconds to completion of mutations by total number of rows in the database.",
        "fig:client-mutations"
    )
}


export function table() {
    return `\\begin{table}[H]
\\begin{adjustbox}{width=\\textwidth}
\\begin{tabular}{${"l".repeat(rows + 1)}}
\\textbf{Rows} & ${Object.keys(data).map(r => `\\textbf{${r}}`).join(" & ")} \\\\
${experiments.map(e => `\\textbf{${experimentLabel(e)}} & ` + Object.values(data).map(
        obj => `${parseFloat(obj[e].mean.toFixed(2))} $\\pm$ ${parseFloat(obj[e].sd.toFixed(2))}`
    ).join(" & ")).join("\\\\\n")
        }
\\end{tabular}
\\end{adjustbox}
\\caption{Duration in milliseconds of client-side operations for databases with different number of rows. (N $\\geq$ 10)}
\\label{tab:client-experiment }
\\end{table}
    `
}

const result = `
${table()}
${figure(
    `${loadTimesSubFigure()}
\\hfill
${selectNSubFigure()}
\\\\
${selectAdvancedSubFigure()}
\\hfill
${operationsSubFigure()}`
    ,
    "Latency of various client-side Relic operations for the meeting room scheduler",
    "fig:client-experiment"
)}
`


console.log(result);
writeFileSync("./output/client.tex", result, "utf8");
