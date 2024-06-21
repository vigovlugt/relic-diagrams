#!/bin/env node

import { readFileSync, readdirSync, writeFileSync } from "fs";

function getData() {
    const obj = {};
    const rows = readdirSync("./data/results");
    for (const row of rows) {
        obj[row] = {};
        const experiments = readdirSync(`./data/results/${row}`);
        for (const experiment of experiments) {
            const file = readFileSync(
                `./data/results/${row}/${experiment}`,
                "utf8"
            );
            obj[row][experiment.replace(".json", "")] = JSON.parse(file);
        }
    }

    return obj;
}

const data = getData();

const rows = Object.keys(data).length;
const experiments = [
    "initial-pull",
    "pull 1 change",
    "pull 10 changes",
    "pull 100 changes",
    "create reservation",
    "update reservation",
    "delete reservation",
]

/**
 * @param {string} e
 */
function experimentLabel(e) {
    switch (e) {
        case "initial-pull":
            return "Initial pull";
        case "pull 1 change":
            return "Pull 1 change";
        case "pull 10 changes":
            return "Pull 10 changes";
        case "pull 100 changes":
            return "Pull 100 changes";
        case "create reservation":
            return "Create reservation";
        case "update reservation":
            return "Update reservation";
        case "delete reservation":
            return "Delete reservation";
    }

    throw new Error("Unknown experiment: " + e);
}

/**
 * @param {string[]} strings
 */
export function legend(...strings) {
    return `\\legend{${strings.join(",")}}`;
}

/**
 * @param {Array<{x: number, y: number}>} data
 */
export function addPlot(data) {
    return `\\addplot coordinates {
${data.map((d) => `(${d.x},${d.y})`).join("\n")}
};`;
}

/**
 * @param {string} children
 * @param {string} ylabel
 * @param {string} xlabel
 */
export function tikzpicture(children, ylabel, xlabel, legendPos) {
    return `\\begin{tikzpicture}
\\begin{axis}[
    scaled x ticks=false,
    xticklabel style={
        /pgf/number format/fixed,
    },
    enlargelimits=0.05,
    xmode=log,
    legend pos=${legendPos},
	ylabel=${ylabel},
    xlabel=${xlabel},
]
${children}
\\end{axis}
\\end{tikzpicture}
`;
}

export function figure(children, caption, label) {
    return `\\begin{figure}[H]
    \\centering

${children}
    
    \\caption{${caption}}
    \\label{${label}}
\\end{figure}`;
}

export function subFigure(children, caption, label) {
    return `\\begin{subfigure}[b]{0.48\\textwidth}
    \\centering
    
${children}

    \\caption{${caption}}
    \\label{${label}}
\\end{subfigure}`;
}

export function resizeBox(children) {
    return `\\resizebox{\\textwidth}{!}{
${children}
}`;
}

export function initialPullSubFigure() {
    const plots = ["initial-pull"].map((e) =>
        addPlot(
            Object.keys(data).map((r) => ({
                x: parseInt(r),
                y: data[r][e].metrics.http_reqs.values.rate,
            }))
        )
    );
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") + "\n" + legend("First time pull"),
                "Requests per second",
                "Total number of rows sent to client",
                "north east"
            )
        ),
        "Throughput in requests per second for the first pull of a new client.",
        "fig:server-initial-pull"
    );
}

export function initialPullLatencySubFigure() {
    const plots = ["initial-pull"].map((e) =>
        addPlot(
            Object.keys(data).map((r) => ({
                x: parseInt(r),
                y: data[r][e].metrics.http_req_duration.values.avg,
            }))
        )
    );
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") + "\n" + legend("First time pull"),
                "Latency (ms)",
                "Total number of rows sent to client",
                "north west"
            )
        ),
        "Latency in milliseconds for the first pull of a new client.",
        "fig:server-initial-pull-latency"
    );
}

export function pullNSubFigure() {
    const plots = ["pull 1 change", "pull 10 changes", "pull 100 changes"].map(
        (e) =>
            addPlot(
                Object.keys(data).map((r) => ({
                    x: parseInt(r),
                    y: data[r][e].metrics.http_reqs.values.rate,
                }))
            )
    );
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") +
                "\n" +
                legend(
                    "Pull 1 change",
                    "Pull 10 changes",
                    "Pull 100 changes"
                ),
                "Requests per second",
                "Total number of client rows",
                "north east"
            )
        ),
        "Throughput for subsequent pulls of clients for N changed rows.",
        "fig:server-pull-n"
    );
}

export function pullNLatencySubFigure() {
    const plots = ["pull 1 change", "pull 10 changes", "pull 100 changes"].map(
        (e) =>
            addPlot(
                Object.keys(data).map((r) => ({
                    x: parseInt(r),
                    y: data[r][e].metrics.http_req_duration.values.avg,
                }))
            )
    );
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") +
                "\n" +
                legend(
                    "Pull 1 change",
                    "Pull 10 changes",
                    "Pull 100 changes"
                ),
                "Latency (ms)",
                "Total number of client rows",
                "north west"
            )
        ),
        "Latency in milliseconds for subsequent pulls of clients for N changed rows.",
        "fig:server-pull-n-latency"
    );
}

export function operationsSubFigure() {
    const plots = [
        "create reservation",
        "update reservation",
        "delete reservation",
    ].map((e) =>
        addPlot(
            Object.keys(data).map((r) => ({
                x: parseInt(r),
                y: data[r][e].metrics.http_reqs.values.rate,
            }))
        )
    );
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") +
                "\n" +
                legend(
                    "Create reservation",
                    "Update reservation",
                    "Delete reservation"
                ),
                "Requests per second",
                "Total number of rows",
                "south west"
            )
        ),
        "Throughput for pushing mutations to the server.",
        "fig:server-push"
    );
}

export function operationsLatencySubFigure() {
    const plots = [
        "create reservation",
        "update reservation",
        "delete reservation",
    ].map((e) =>
        addPlot(
            Object.keys(data).map((r) => ({
                x: parseInt(r),
                y: data[r][e].metrics.http_req_duration.values.avg,
            }))
        )
    );
    return subFigure(
        resizeBox(
            tikzpicture(
                plots.join("\n") +
                "\n" +
                legend(
                    "Create reservation",
                    "Update reservation",
                    "Delete reservation"
                ),
                "Latency (ms)",
                "Total number of rows",
                "north west"
            )
        ),
        "Latency in milliseconds for pushing mutations to the server.",
        "fig:server-push-latency"
    );
}

export function tableThroughput() {
    return `\\begin{table}[H]
\\centering
\\begin{tabular}{${"l".repeat(rows + 1)}}
\\textbf{Rows} & ${Object.keys(data)
            .map((r) => `\\textbf{${r}}`)
            .join(" & ")} \\\\
${experiments
            .map(
                (e) =>
                    `\\textbf{${experimentLabel(e)}} & ` +
                    Object.values(data)
                        .map(
                            (obj) =>
                                `${parseFloat(
                                    obj[e].metrics.http_reqs.values.rate.toFixed(2)
                                )}`
                        )
                        .join(" & ")
            )
            .join("\\\\\n")}
\\end{tabular}
\\caption{Througput in requests per second for server-side operations per number of rows in client state.}
\\label{tab:server-relic-experiment}
\\end{table}
`;
}

export function tableLatency() {
    return `\\begin{table}[H]
\\centering
\\begin{adjustbox}{width=\\textwidth}
\\begin{tabular}{${"l".repeat(rows + 1)}}
\\textbf{Rows} & ${Object.keys(data)
            .map((r) => `\\textbf{${r}}`)
            .join(" & ")} \\\\
${experiments
            .map(
                (e) =>
                    `\\textbf{${experimentLabel(e)}} & ` +
                    Object.values(data)
                        .map(
                            (obj) =>
                                `${parseFloat(
                                    obj[e].metrics.http_req_duration.values.avg.toFixed(2)
                                )} (${parseFloat(
                                    obj[e].metrics.http_req_duration.values["p(95)"].toFixed(2)
                                )})`
                        )
                        .join(" & ")
            )
            .join("\\\\\n")}
\\end{tabular}
\\end{adjustbox}
\\caption{Average latency in milliseconds for server-side operations per number of rows in client state. The 95th percentile of latency is shown in parentheses.}
\\label{tab:server-relic-experiment-latency}
\\end{table}
`;
}

const result = `
${tableThroughput()}
${tableLatency()}
${figure(
    `${initialPullSubFigure()}
\\hfill
${initialPullLatencySubFigure()}
\\\\
${pullNSubFigure()}
\\hfill
${pullNLatencySubFigure()}
\\\\
${operationsSubFigure()}
\\hfill
${operationsLatencySubFigure()}`,
    "Throughput of server for handling pull and push requests by total number of rows in client state.",
    "fig:server-relic-experiment"
)}
`;

console.log(result);
writeFileSync("./output/server.tex", result, "utf8");
